var httpProxy = require('http-proxy'),
    connect = require('connect'),
    logger = connect.logger('dev'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

var Session = function (sessionId, req, res) {
    this.id = req._uniqueSessionId = res._uniqueSessionId = sessionId;
    this.request = req;
    this.response = res;
    this.state = 'start';
};
Session.extractSessionId = function (req) {
    return req._uniqueSessionId;
};

var SessionStorage = function () {
    var sessionHash = {},
        sessionIdCounter = 0,
        nextId = function () {
            return sessionIdCounter += 1;
        };

    this.startSession = function (req, res) {
        var sessionId = nextId(), session;
        sessionHash[sessionId] = session = new Session(sessionId, req, res);
        return session;
    };

    this.popSession = function (req) {
        var sessionId = Session.extractSessionId(req),
            session = sessionHash[sessionId];

        delete sessionHash[sessionId];

        return session;
    };

};


var ProxyServer = function ProxyServer() {
    EventEmitter.call(this);

    var sessionStorage = new SessionStorage(),
        proxyServer = httpProxy.createServer(function (req, res, proxy) {
            var headersHost = req.headers['host'],
                hostAndPort = headersHost.split(':'),
                targetHost = hostAndPort[0],
                targetPort = parseInt(hostAndPort[1]) || 80;
            req.originalUrl = req.url;
            logger(req, res, function () {
                proxy.proxyRequest(req, res, {
                    host: targetHost,
                    port: targetPort
                });
            })
        }), proxy = proxyServer.proxy,
        listening = false,
        requestToProxyMirrorWebApp = function (req) {
            return req.url === 'http://localhost:8889/' || req.originalUrl === 'http://localhost:8889/';
        };

    this.startSession = function (req, res) {
        if (requestToProxyMirrorWebApp(req)) {
            return;
        }
        var session = sessionStorage.startSession(req, res);

        this.emit('session.start', session);
    };
    this.endSession = function (req, res) {
        if (requestToProxyMirrorWebApp(req)) {
            return;
        }
        var session = sessionStorage.popSession(req);
        if(session){
            this.emit('session.end', session);
        }
    };

    this.start = function (done) {
        done = done || function () {
        };
        proxy.on('start', this.startSession.bind(this));
        proxy.on('end', this.endSession.bind(this));
        proxyServer.listen(8888, function () {
            listening = true;
            done();
        });
    };

    this.stop = function (done) {
        done = done || function () {
        };
        proxy.removeAllListeners('start');
        proxy.removeAllListeners('end');
        if (listening) {
            proxyServer.close(function () {
                listening = false;
                done();
            });
        }
    };
};
util.inherits(ProxyServer, EventEmitter);


module.exports = ProxyServer;