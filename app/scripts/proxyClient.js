(function(){

    var proxyClient = angular.module('proxyMirrorApp.proxyClient', []);

    var Session = function (id){
        this.id = id;
        this.state = 'start';
        this.request = {};
        this.response = {};
        this.started = function(sessionMsg){
            this.request = sessionMsg.request;
        };
        this.ended = function(sessionMsg){
            this.response = sessionMsg.response;
            this.response.contentType = this.niceContentType();
        };

        this.niceContentType = function(){
            var fullContentType = this.response.headers['content-type'] || '';
            return fullContentType.split(';')[0] || '';
        };
    };

    var SessionStorage = function (proxy){
        var that = this,
            sessionHash = {};
        this.proxy = proxy;
        this.sessions = [];

        proxy.on('session.start', function(sessionMsg){
            var session = new Session(sessionMsg.id);
            sessionHash[session.id] = session;
            session.started(sessionMsg);
            that.sessions.push(session);
        });
        proxy.on('session.end', function(sessionMsg){
            var session = sessionHash[sessionMsg.id];
            if(session){
                session.ended(sessionMsg);
            }
        });
    };

    var ProxyConnection = function(socket){
        Observable(this);
        var that = this;
        socket.on('connect', function(){
            that.state = 'connected';
        });

        socket.on('session.start', function(session){
            that.trigger('session.start', [session]);
        });
        socket.on('session.end', function(session){
            that.trigger('session.end', [session]);
        });
    };

    proxyClient.service('socket', function ($rootScope) {
        var socket = io.connect();
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            }
        };
    });


    proxyClient.service('proxy', function(socket){
        var proxyConnection = new ProxyConnection(socket);
        return proxyConnection;
    });

    proxyClient.service('sessionStorage', function(proxy){
        var sessionStorage = new SessionStorage(proxy);

        return  sessionStorage;
    });

}());
