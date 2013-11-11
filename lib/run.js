var ProxyServer = require('./proxy.js'),
    ClientBroadcast = require('./clientBroadcast.js'),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

io.set('log level', 2);

var Run = function(){
    var that = this, started = false;
    this.httpServer = server;
    this.httpServer.use = function(){
        app.use.apply(app, arguments);
    };
    var proxyServer = new ProxyServer();
    var clientBroadcast = new ClientBroadcast(io, proxyServer);
    this.start = function(done){
        done = done || function(){};
        if(started){
            done();
        }
        started = true;
        this.httpServer.on('listening', function(){
            proxyServer.start(function(){
                that.httpServer.on('close', function(){
                    proxyServer.stop(function(){
                        started = false;
                        console.log('proxy-mirror stopped');
                    });
                });
                done();
            });
        });
    };

};

module.exports = Run;
