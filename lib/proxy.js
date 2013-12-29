var httpProxy = require('http-proxy'),
    https = require('https'),
    connect = require('connect'),
    logger = connect.logger('dev'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Iconv = require('iconv').Iconv,
    fs = require('fs'),
    net = require('net'),
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
    this.request.bodyAsString = null;
    this.request.bodyAsBase64 = null;
    this.response = res;
    this.response.bodyAsString = null;
    this.response.bodyAsBase64 = null;
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
            request.bodyAsString = buffersConcatenated.toString();
            that.emit('request.end', that);
        });

        return output;
    };

    this.response.bodyBuffers = hookInResponseWrite();
    this.request.bodyBuffers = hookInRequestData();

    this.ended = function () {
        var buffersConcatenated = Buffer.concat(this.response.bodyBuffers);
        var contentType = this.response.getHeader('content-type') || '';
        var charsetMatch = contentType.match(/charset=(.+)/) || [];
        var charset = charsetMatch[1] || 'utf-8';
        var iconv = new Iconv(charset, 'utf-8');

        try {
            var convertedBuffer = iconv.convert(buffersConcatenated);
            this.response.bodyAsString = convertedBuffer.toString();
        } catch (e) {
            this.response.bodyAsBase64 = buffersConcatenated.toString('base64');
        }

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
            if (requestToProxyMirrorWebApp(req)) {
                req.url = req.url.replace(/http:\/\/localhost:8889\//, '/');
            }
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
            console.log('secure handler ', req.headers);
            req.originalUrl = req.url;
            if(!req.originalUrl.match(/https/)){
                req.originalUrl = 'https://' + parsedHostHeader.host + req.url;
            }
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
            var matcher = /\/\/localhost:8889\//;
            return req.url.match(matcher) || req.originalUrl.match(matcher);
        };

    proxyServer.addListener('connect', function (request, socketRequest, bodyhead) {
        var srvSocket = net.connect(secureServerPort, 'localhost', function () {
            socketRequest.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            srvSocket.write(bodyhead);
            srvSocket.pipe(socketRequest);
            socketRequest.pipe(srvSocket);
        });
    });

    proxyServer.on('upgrade', function (req, socket, head) {
        proxy.proxyWebSocketRequest(req, socket, head);
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