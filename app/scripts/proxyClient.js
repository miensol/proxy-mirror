(function () {

    var proxyClient = angular.module('proxyMirrorApp.proxyClient', []);

    var Headers = function () {
        var that = this;
        this.uniformHeaders = function () {
            return Object.keys(this.headers).map(function (key) {
                var headerValue = that.headers[key];
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

    var Session = function (id) {
        this.id = id;
        this.state = 'start';
        this.request = {};
        this.response = {};
        this.started = function (sessionMsg) {
            this.request = sessionMsg.request;
            Headers.call(this.request);
        };
        this.ended = function (sessionMsg) {
            this.response = sessionMsg.response;
            this.response.contentType = this.niceContentType();
            Headers.call(this.response);
        };

        this.requestEnded = function(sessionMsg){
            this.request = sessionMsg.request;
            Headers.call(this.request);
        };

        this.niceContentType = function () {
            var fullContentType = this.response.headers['content-type'] || '';
            return fullContentType.split(';')[0] || '';
        };
    };

    var SessionStorage = function (proxy) {
        var that = this,
            sessionHash = {};
        this.proxy = proxy;
        this.sessions = [];
        this.selectedSession = null;

        proxy.on('session.start', function (sessionMsg) {
            var session = new Session(sessionMsg.id);
            sessionHash[session.id] = session;
            session.started(sessionMsg);
            that.sessions.push(session);
        });
        proxy.on('session.request.end', function(sessionMsg){
            var session = sessionHash[sessionMsg.id];
            if(session){
                session.requestEnded(sessionMsg);
            }
        });
        proxy.on('session.end', function (sessionMsg) {
            var session = sessionHash[sessionMsg.id];
            if (session) {
                session.ended(sessionMsg);
            }
        });

        this.selectSession = function(session){
            if(this.selectedSession != session){
                this.selectedSession = session;
                return true;
            }
            return false;
        };

    };

    var ProxyConnection = function (socket) {
        Observable(this);
        var that = this;
        socket.on('connect', function () {
            that.state = 'connected';
        });
        ['session.start','session.request.end', 'session.end'].forEach(function(eventName){
            socket.on(eventName, function (session) {
                that.trigger(eventName, [session]);
            });
        });
    };

    proxyClient.service('socket', function ($rootScope) {
        var socket = io.connect('/',{
            'sync disconnect on unload': true
        });
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


    proxyClient.service('proxy', function (socket) {
        var proxyConnection = new ProxyConnection(socket);
        return proxyConnection;
    });

    proxyClient.service('sessionStorage', function (proxy) {
        var sessionStorage = new SessionStorage(proxy);

        return  sessionStorage;
    });

}());
