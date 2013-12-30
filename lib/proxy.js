var httpProxy = require('http-proxy'),
    https = require('https'),
    connect = require('connect'),
    logger = connect.logger('dev'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Iconv = require('iconv').Iconv,
    convertBuffer = require('./convertBuffer'),
    fs = require('fs'),
    net = require('net'),
    url = require('url'),
    path = require('path'),
    certDir = path.join(__dirname, '/../cert'),
    httpsOpts = {
        key: fs.readFileSync(path.join(certDir, 'proxy-mirror.key'), 'utf8'),
        cert: fs.readFileSync(path.join(certDir, 'proxy-mirror.crt'), 'utf8')
    };

var Session = function (sessionId, req, res) {
    EventEmitter.call(this);
    var that = this;
    this.id = req._uniqueSessionId = res._uniqueSessionId = sessionId;
    this.request = req;
    this.request.body = {asString: null, asBase64: null};
    this.response = res;
    this.response.body = {asString: null, asBase64: null};
    this.state = 'start';

    var hookInResponseWrite = function () {
        var response = that.response;
        var _write = response.write;
        var output = [];
        response.write = function (chunk, encoding) {
            output.push(chunk);
            _write.apply(response, arguments);
        };
        return output;
    }, hookInRequestData = function () {
        var request = that.request,
            output = [];


        request.on('data', function (chunk, encoding) {
            output.push(chunk);
        });

        request.on('end', function () {
            var buffersConcatenated = Buffer.concat(output);
            request.body.asString = buffersConcatenated.toString();
            that.emit('request.end', that);
        });

        return output;
    };

    this.response.bodyBuffers = hookInResponseWrite();
    this.request.bodyBuffers = hookInRequestData();

    this.ended = function () {
        var buffersConcatenated = Buffer.concat(this.response.bodyBuffers);
        this.response.body.asString = convertBuffer.convertEncodingContentType(buffersConcatenated,this.response.getHeader('content-type') || '');
        this.response.body.asBase64 = buffersConcatenated.toString('base64');
        this.removeAllListeners();
    };
};
util.inherits(Session, EventEmitter);
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

    var proxyPort = 8888,
        secureServerPort = 8887,
        parseHostHeader = function (headersHost, defaultPort) {
            var hostAndPort = headersHost.split(':'),
                targetHost = hostAndPort[0],
                targetPort = parseInt(hostAndPort[1]) || defaultPort;

            return {hostname: targetHost, port: targetPort, host: headersHost};
        },
        sessionStorage = new SessionStorage(),
        adjustRequestUrl = function(req){
            if (requestToProxyMirrorWebApp(req)) {
                req.url = req.url.replace(/http:\/\/localhost:8889\//, '/');
            }
            req.url = url.parse(req.url).path;
        },
        proxyServer = httpProxy.createServer({
            changeOrigin: true,
            enable: {
                xforward: false
            }
        }, function (req, res, proxy) {
            var parsedHostHeader = parseHostHeader(req.headers['host'], 80),
                targetHost = parsedHostHeader.hostname,
                targetPort = parsedHostHeader.port;
            req.originalUrl = req.url;
            adjustRequestUrl(req);
            logger(req, res, function () {
                proxy.proxyRequest(req, res, {
                    host: targetHost,
                    port: targetPort
                });
            })

        }),
        proxy = proxyServer.proxy,
        secureServer = https.createServer(httpsOpts, function (req, res) {
            var parsedHostHeader = parseHostHeader(req.headers.host, 443);
//            console.log('secure handler ', req.headers);
            req.originalUrl = req.url;
            if(!req.originalUrl.match(/https/)){
                req.originalUrl = 'https://' + parsedHostHeader.host + req.url;
            }
            adjustRequestUrl(req);
            logger(req, res, function () {
                proxy.proxyRequest(req, res, {
                    host: parsedHostHeader.hostname,
                    port: parsedHostHeader.port,
                    changeOrigin: true,
                    target: {
                        https: true
                    }
                });
            });
        }),
        listening = false,
        requestToProxyMirrorWebApp = function (req) {
            var matcher = /(localhost:8889)|(localhost:35729)/;
            return req.url.match(matcher) || (req.originalUrl && req.originalUrl.match(matcher));
        };

    [secureServer,proxyServer].forEach(function(server){
        server.on('upgrade', function (req, socket, head) {
//            console.log('upgrade', req.url);
            proxy.proxyWebSocketRequest(req, socket, head);
        });
    });

    proxyServer.addListener('connect', function (request, socketRequest, bodyhead) {
        //TODO: we're only fixing web socket connections to proxy - other web socket connections won't work :(
//        console.log('conenct', request.method, request.url, bodyhead);
        var targetPort = secureServerPort,
            parsedHostHeader = parseHostHeader(request.headers.host);
        if(requestToProxyMirrorWebApp(request)){
            targetPort = parsedHostHeader.port;
        }
        var srvSocket = net.connect(targetPort, 'localhost', function () {
            socketRequest.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            srvSocket.write(bodyhead);
            srvSocket.pipe(socketRequest);
            socketRequest.pipe(srvSocket);
        });
    });


    this.emitSessionRequestEnd = function (session) {
        this.emit('session.request.end', session);
    };

    this.startSession = function (req, res) {
        if (requestToProxyMirrorWebApp(req)) {
            return;
        }
        var session = sessionStorage.startSession(req, res);
        this.emit('session.request.start', session);
        session.on('request.end', this.emitSessionRequestEnd.bind(this));
    };
    this.endSession = function (req, res) {
        if (requestToProxyMirrorWebApp(req)) {
            return;
        }
        var session = sessionStorage.popSession(req);
        if (session) {
            session.ended();
            this.emit('session.response.end', session);
        }
    };

    this.start = function (done) {
        done = done || function () {
        };
        proxy.on('start', this.startSession.bind(this));
        proxy.on('end', this.endSession.bind(this));
        proxyServer.listen(proxyPort, function () {
            secureServer.listen(secureServerPort, function () {
                listening = true;
                done();
            });
        });
    };

    this.stop = function (done) {
        done = done || function () {
        };
        proxy.removeAllListeners('start');
        proxy.removeAllListeners('end');
        if (listening) {
            secureServer.close(function () {
                proxyServer.close(function () {
                    listening = false;
                    done();
                });
            });
        }
    };
};
util.inherits(ProxyServer, EventEmitter);


module.exports = ProxyServer;