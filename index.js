var ProxyServer = require('./proxy.js');

var proxy = new ProxyServer();

proxy.on('start', function(session){
    console.log('proxy.start', session);
});
proxy.on('end', function(session){
    console.log('proxy.end', session);
});

proxy.start();
