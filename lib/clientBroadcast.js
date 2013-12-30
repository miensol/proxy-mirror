var url = require('url');
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
            asBase64: bodyContainer.body.asBase64 || null
        };
    };
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
};
var ResponseAdapter = function(resposne){
    Headers.call(this);
    BodyHandler.call(this);
    this.statusCode = resposne.statusCode;
    this.statusMsg = resposne._header.split('\r')[0];
    this.headers = this.uniformHeaders(resposne._headers);
    this.setupBody(resposne);
};

var ClientBroadcast = function(io, proxy){
    var that = this,
        startMessageForRequest = function (request){
            return new RequestAdapter(request);
        },
        endMessageForResponse = function(response){
            return new ResponseAdapter(response);
        };

    this.startBroadcastOf = function(eventName, socket, messageProducer){
        var listener = function () {
            socket.emit(eventName, messageProducer.apply(this, arguments));
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
        return {
            id: session.id,
            request: startMessageForRequest(session.request)
        };
    };
    this.sessionResponseEndMessage = function(session){
        return {
            id: session.id,
            request: startMessageForRequest(session.request),
            response: endMessageForResponse(session.response)
        };
    };
    this.sessionRequestEndMessage = function(session){
        return {
            id: session.id,
            request: startMessageForRequest(session.request)
        };
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
