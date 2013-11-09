var ClientBroadcast = function(io){
    var that = this,
        proxy = null,
        startMessageForRequest = function (request){
            return {
                url: request.url,
                headers: request.headers
            };
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

    this.broadcastSessionFrom = function(newProxy){
        proxy = newProxy;
        io.sockets.on('connection', function(socket){
            console.log('socket.io connection');
            socket.emit('general.connected', {});
            that.startBroadcastOf('session.start', socket, that.sessionStartMessage);
        });
    };
};


module.exports = ClientBroadcast;
