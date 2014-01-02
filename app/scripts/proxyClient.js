(function () {

    var proxyClient = angular.module('proxyMirrorApp.proxyClient', []);

    var Request = function(){

    };

    var Response = function(){
        var that = this;
        var niceContentType = function () {
            var fullContentType = that.headers['Content-Type'] || '';
            return fullContentType.split(';')[0] || '';
        };

        this.contentType = niceContentType();
    };

    var Session = function (id) {
        this.id = id;
        this.state = '';
        this.request = {};
        this.response = {};
        this.requestStart = function (sessionMsg) {
            this.state = 'request.start';
            this.request = sessionMsg.request;
            Request.call(this.request);
        };
        this.responseEnd = function (sessionMsg) {
            this.state = 'response.end';
            this.response = sessionMsg.response;
            Response.call(this.response);
        };

        this.requestEnd = function(sessionMsg){
            this.state = 'request.end';
            this.request = sessionMsg.request;
            Request.call(this.request);
        };


    };

    var SessionStorage = function (proxy) {
        var limit = 1000,
            that = this,
            sessionHash = {},
            limitSessionsCount = function(){
                var removedSession = null;
                if(that.sessions.length > limit){
                    removedSession = that.sessions.splice(0,1)[0];
                    if(that.selectedSession === removedSession){
                        that.selectSession(null);
                    }
                }

            };
        this.proxy = proxy;
        this.sessions = [];
        this.selectedSession = null;

        proxy.on('session.request.start', function (sessionMsg) {
            var session = new Session(sessionMsg.id);
            sessionHash[session.id] = session;
            session.requestStart(sessionMsg);
            that.sessions.push(session);
            limitSessionsCount();
        });
        proxy.on('session.request.end', function(sessionMsg){
            var session = sessionHash[sessionMsg.id];
            if(session){
                session.requestEnd(sessionMsg);
            }
        });
        proxy.on('session.response.end', function (sessionMsg) {
            var session = sessionHash[sessionMsg.id];
            if (session) {
                session.responseEnd(sessionMsg);
            }
        });

        this.selectSession = function(session){
            if(this.selectedSession != session){
                this.selectedSession = session;
                return true;
            }
            return false;
        };

        this.clearSessions = function(){
            this.selectSession(null);
            this.sessions.length = 0;
            sessionHash = {};
        };

    };

    var ProxyConnection = function (socket) {
        Observable(this);
        var that = this;
        socket.on('connect', function () {
            that.state = 'connected';
        });
        ['session.request.start','session.request.end', 'session.response.end'].forEach(function(eventName){
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
