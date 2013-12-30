var url = require('url'),
    zlib = require('zlib'),
    q = require('q'),
    convertBuffer = require('./convertBuffer');
var Headers = function () {
    this.uniformHeaders = function (headersHash) {
        return Object.keys(headersHash).map(function (key) {
            var headerValue = headersHash[key];
            var newName = key.split('-').map(function (oldName) {
                return oldName.substring(0, 1).toUpperCase() + oldName.substring(1);
            }).join('-');
            return [newName, headerValue];
        }).reduce(function (acc, cur) {
                acc[cur[0]] = cur[1];
                return acc;
            }, {});
    };
};

var BodyHandler = function(){
    this.setupBody = function(bodyContainer){
        this.body = {
            asString: bodyContainer.body.asString || null,
            asBase64: bodyContainer.body.asBase64 || null,
            asUncompressedString: null,
            asUncompressedBase64: null
        };
    };

    this.unCompressBody = function(headers, bodyBuffers){
        var that = this;
        var contentEncoding = headers['Content-Encoding'];
        var deffer = q.defer();
        if(contentEncoding && bodyBuffers.length>0){
            var buffers = Buffer.concat(bodyBuffers);
            if(contentEncoding === "gzip"){
                zlib.gunzip(buffers, function(err, decoded) {
                    deffer.resolve(decoded);
                });
            } else {
                if(contentEncoding === "deflate"){
                    zlib.inflate(buffers, function(err, decoded) {
                        deffer.resolve(decoded);
                    })
                }
            }
        }else{
            deffer.resolve(null);
        }
        return deffer.promise.then(function(resultBuffer){
            if(resultBuffer){
                that.body.asUncompressedString = convertBuffer.convertEncodingContentType(resultBuffer, headers['Content-Type']);
                that.body.asUncompressedBase64 = resultBuffer.toString('base64');
            }
            return that;
        });
    }
};

var RequestAdapter = function(request){
    Headers.call(this);
    BodyHandler.call(this);
    this.method = request.method;
    this.httpVersion = request.httpVersion;
    this.url = request.url;
    this.urlObj = url.parse(request.originalUrl);
    this.headers = this.uniformHeaders(request.headers);
    this.setupBody(request);

    this.unCompressIfNeeded = function(bodyBuffers){
        return this.unCompressBody(this.headers, bodyBuffers);
    };
};
var ResponseAdapter = function(resposne){
    Headers.call(this);
    BodyHandler.call(this);
    this.statusCode = resposne.statusCode;
    this.statusMsg = resposne._header.split('\r')[0];
    this.headers = this.uniformHeaders(resposne._headers);
    this.setupBody(resposne);

    this.unCompressIfNeeded = function(bodyBuffers){
        return this.unCompressBody(this.headers, bodyBuffers);
    };
};

var ClientBroadcast = function(io, proxy){
    var that = this,
        messageForRequest = function (request){
            var adapter = new RequestAdapter(request);
            return adapter.unCompressIfNeeded(request.bodyBuffers);
        },
        messageForResponse = function(response){
            var adapter = new ResponseAdapter(response);
            return adapter.unCompressIfNeeded(response.bodyBuffers);
        };

    this.startBroadcastOf = function(eventName, socket, messageProducer){
        var listener = function () {
            messageProducer.apply(this, arguments).then(function(message){
                socket.emit(eventName, message);
            });
        };
        proxy.on(eventName, listener);
        return {
            eventName: eventName,
            listener: listener
        };
    };
    this.stopBroadcastOf = function(listenerObj){
        proxy.removeListener(listenerObj.eventName, listenerObj.listener);
    };

    this.sessionRequestStartMessage = function(session){
        return that.sessionRequestEndMessage(session);
    };
    this.sessionResponseEndMessage = function(session){
        var request = messageForRequest(session.request);
        var response = messageForResponse(session.response);
        return q.all([request, response]).then(function(requestAndResponse){
            return {
                id: session.id,
                request: requestAndResponse[0],
                response: requestAndResponse[1]
            };
        });

    };
    this.sessionRequestEndMessage = function(session){
        var request = messageForRequest(session.request);
        return q.all([request]).then(function(requestAndResponse){
            return {
                id: session.id,
                request: requestAndResponse[0]
            };
        });
    };

    io.sockets.on('connection', function(socket){
        console.info('io.sockets.connection', socket.id);
        var listeners = [
            that.startBroadcastOf('session.request.start', socket, that.sessionRequestStartMessage),
            that.startBroadcastOf('session.request.end', socket, that.sessionRequestEndMessage),
            that.startBroadcastOf('session.response.end', socket, that.sessionResponseEndMessage)
        ];
        socket.on('disconnect', function(){
            console.info('io.sockets.disconnect', socket.id);
            listeners.forEach(that.stopBroadcastOf.bind(that));
        });
    });

};


module.exports = ClientBroadcast;
