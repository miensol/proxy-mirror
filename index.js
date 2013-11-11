var express = require('express');

var ProxyMirrorRun = require('./lib/run.js');

var run = new ProxyMirrorRun();

console.log('proxy-mirror starting');
run.start(function(){
    console.log('proxy-mirror started');
});

run.httpServer.listen(8889);




