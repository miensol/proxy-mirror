var httpProxy = require('http-proxy'),
    fs = require('fs'),
    path = require('path'),
    certDir = path.join(__dirname, '/../cert'),
    https = require('https'),
    http = require('http'),
    net = require('net'),
    url = require('url'),
    httpsOpts = {
        key: fs.readFileSync(path.join(certDir, 'proxy-mirror.key'), 'utf8'),
        cert: fs.readFileSync(path.join(certDir, 'proxy-mirror.crt'), 'utf8')
    },
    options = {
        https: httpsOpts,
        target: {
            https: true // This could also be an Object with key and cert properties
        }
    };
//
// Create an instance of HttpProxy to use with another HTTPS server
//
var server = httpProxy.createServer({
    changeOrigin: true
}, function(req, res, proxy){
    console.log('proxy handler');
    proxy.proxyRequest(req,res);
});

var secureServer = https.createServer(options.https, function(req, res){
    var srvUrl = url.parse('https://' + req.url);
    console.log('secure handler ', req.headers);
//    req.url = 'https://www.google.pl';
    server.proxy.proxyRequest(req, res, {
        host: req.headers.host,
        port: 443,
        changeOrigin: true,
        target: {
            https: true
        }
    });
});
secureServer.listen(8003);

//
//var server = http.createServer(function (req, res) {
////var server = https.createServer(options.https, function (req, res) {
//    proxy.proxyRequest(req, res);
//});

server.addListener('connect', function (request, socketRequest, bodyhead ) {
    var response = new http.ServerResponse(request);
    var srvUrl = url.parse('https://' + request.url);

    var srvSocket = net.connect(8003, 'localhost', function() {
        socketRequest.write('HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: Node-Proxy\r\n' +
            '\r\n');
        srvSocket.write(bodyhead);
        srvSocket.pipe(socketRequest);
        socketRequest.pipe(srvSocket);
    });
//    server.proxy.proxyRequest(request, response, {
//        host: 'localhost',
//        port: 8003
//    });
});

server.listen(8002);



