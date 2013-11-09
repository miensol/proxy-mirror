var ProxyServer = require('./proxy.js');

var proxy = new ProxyServer();

proxy.on('session.start', function(session){
    console.log('session.start', session);
});
proxy.on('session.end', function(session){
    console.log('session.end', session);
});

proxy.start();
