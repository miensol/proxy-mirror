var ClientBroadcast = function(io){
    var that = this,
        proxy = null,
        startMessageForRequest = function (request){
            return {
                url: request.url,
                method: request.method,
                headers: request.headers
            };
        },
        endMessageForResponse = function(response){
            return {
                statusCode: response.statusCode,
                headers: response._headers,
                body: response.body
            }
        }, endMessageForRequest = function(request){
            var baseMessage = startMessageForRequest(request);
            baseMessage.body = request.body;
            return baseMessage;
        };

    this.startBroadcastOf = function(eventName, socket, messageProducer){
        proxy.on(eventName, function(){
            socket.emit(eventName, messageProducer.apply(this, arguments));
        });
    };

    this.sessionStartMessage = function(session){
        return {
            id: session.id,
            request: startMessageForRequest(session.request)
        };
    };
    this.sessionEndMessage = function(session){
        return {
            id: session.id,
            request: startMessageForRequest(session.request),
            response: endMessageForResponse(session.response)
        };
    };
    this.requestEndMessage = function(session){
        return {
            id: session.id,
            request: endMessageForRequest(session.request)
        };
    };

    this.broadcastSessionFrom = function(newProxy){
        proxy = newProxy;
        io.sockets.on('connection', function(socket){
            that.startBroadcastOf('session.start', socket, that.sessionStartMessage);
            that.startBroadcastOf('session.request.end', socket, that.requestEndMessage);
            that.startBroadcastOf('session.end', socket, that.sessionEndMessage);
        });
    };
};


module.exports = ClientBroadcast;
