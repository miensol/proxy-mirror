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

    this.sessionRequestStartMessage = function(session){
        return {
            id: session.id,
            request: startMessageForRequest(session.request)
        };
    };
    this.sessionResponseEndMessage = function(session){
        return {
            id: session.id,
            request: endMessageForRequest(session.request),
            response: endMessageForResponse(session.response)
        };
    };
    this.sessionRequestEndMessage = function(session){
        return {
            id: session.id,
            request: endMessageForRequest(session.request)
        };
    };


    io.sockets.on('connection', function(socket){
        var listeners = [
            that.startBroadcastOf('session.request.start', socket, that.sessionRequestStartMessage),
            that.startBroadcastOf('session.request.end', socket, that.sessionRequestEndMessage),
            that.startBroadcastOf('session.response.end', socket, that.sessionResponseEndMessage)
        ];
        socket.on('disconnect', function(){
            listeners.forEach(that.stopBroadcastOf.bind(that));
        });
    });

};


module.exports = ClientBroadcast;
