var ClientBroadcast = function(io, proxy){
    var that = this,

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
                bodyAsString: response.bodyAsString,
                bodyAsBase64: response.bodyAsBase64
            }
        }, endMessageForRequest = function(request){
            var baseMessage = startMessageForRequest(request);
            baseMessage.bodyAsString = request.bodyAsString;
            baseMessage.bodyAsBase64= request.bodyAsBase64;
            return baseMessage;
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

    this.sessionStartMessage = function(session){
        return {
            id: session.id,
            request: startMessageForRequest(session.request)
        };
    };
    this.sessionEndMessage = function(session){
        return {
            id: session.id,
            request: endMessageForRequest(session.request),
            response: endMessageForResponse(session.response)
        };
    };
    this.requestEndMessage = function(session){
        return {
            id: session.id,
            request: endMessageForRequest(session.request)
        };
    };


    io.sockets.on('connection', function(socket){
        var listeners = [
            that.startBroadcastOf('session.start', socket, that.sessionStartMessage),
            that.startBroadcastOf('session.request.end', socket, that.requestEndMessage),
            that.startBroadcastOf('session.end', socket, that.sessionEndMessage)
        ];
        socket.on('disconnect', function(){
            listeners.forEach(that.stopBroadcastOf.bind(that));
        });
    });

};


module.exports = ClientBroadcast;
