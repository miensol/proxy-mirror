var ProxyServer = require('./proxy.js'),
    ClientBroadcast = require('./clientBroadcast.js'),
    express = require('express'),
    app = express();

app.use(express.static(__dirname + '/../.tmp'));
app.use(express.static(__dirname + '/../app'));
app.use(express.logger());

var Run = function(){
    var that = this, started = false;

    this.httpServer = require('http').createServer(app);
    this.io = require('socket.io').listen(this.httpServer);
    this.io.set('log level', 1);

    this.httpServer.use = function(){
        app.use.apply(app, arguments);
    };

    var proxyServer = new ProxyServer();
    var clientBroadcast = new ClientBroadcast(this.io, proxyServer);



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
