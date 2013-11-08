var httpProxy = require('http-proxy'),
    connect = require('connect'),
    logger = connect.logger('dev'),
    events = require('events');

var Session = function(sessionId, req, res){
    req._uniqueSessionId = res._uniqueSessionId = sessionId;
};

var SessionStorage = function(){
    var sessionHash = {},
        sessionIdCounter = 0,
        nextId = function(){
            sessionIdCounter += 1;
        };

    this.startSession = function(req,res){
        var sessionId = nextId(), session;
        sessionHash[sessionId] = session = new Session(sessionId, req,res);
        return session;
    };

};


var ProxyServer = module.exports = function(){
    events.EventEmitter.call(this);

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
        });
    });

    this.startSession = function(req,res){
        var session = sessionStorage.startSession(req, res);

        this.emit('start', session);
    };
    this.start = function(){
        proxyServer.on('start', this.startSession.bind(this));
        proxyServer.listen(8888);
    };
};