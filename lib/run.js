var ProxyServer = require('./proxy.js'),
    ClientBroadcast = require('./clientBroadcast.js'),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


var Run = function(){
    this.httpServer = server;
    this.httpServer.use = function(){
        app.use.apply(app, arguments);
    };
    var proxyServer = new ProxyServer();
    var clientBroadcast = new ClientBroadcast(io);



    this.start = function(done){
        done = done || function(){};
        clientBroadcast.broadcastSessionFrom(proxyServer);
        proxyServer.start(done);
    };

};

module.exports = Run;
