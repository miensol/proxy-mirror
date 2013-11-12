var should = require('should');
var request = require('request').defaults({'proxy':'http://localhost:8888'});
var ProxyServer = require('../lib/proxy.js');

describe('ProxyServer', function(){
    var proxyServer = null;
    before(function(done){
        proxyServer = new ProxyServer();
        proxyServer.start(done)
    });

    after(function(done){
        proxyServer.stop(done);
    });

    beforeEach(function(){
       proxyServer.removeAllListeners();
    });

    it('should be able start it',function(){
        should.exist(proxyServer);
    });

    describe('events', function(){

        describe('listen to session.request.start', function(){
            var sessions = [];
            beforeEach(function(){
                sessions = [];
                proxyServer.on('session.request.start', function(session){
                    sessions.push(session);
                });
            });

            it('should not fire session request start without a request',function(){
                sessions.should.be.empty;
            });


            it('should start one session for one request',function(done){
                request.get('http://www.google.pl/', function(){
                    sessions.should.have.length(1);
                    done();
                });
            });

            it('should start 2 sessions for 2 requests',function(done){
                request.get('http://www.google.pl/', function(){
                    request.get('http://www.google.pl/', function(){
                        sessions.should.have.length(2);
                        done();
                    });
                });
            });

            it('should skip requests to proxy-morror web application',function(done){
                request.get('http://localhost:8889/', function(){
                    sessions.should.have.length(0);
                    done();
                });
            });
        });

        describe('listen to session.end', function(){
            var startedSessions = [], endedSessions = [];
            beforeEach(function(){
                startedSessions = [];
                endedSessions = [];
                proxyServer.on('session.request.start', function(session){
                    startedSessions.push(session);
                });
                proxyServer.on('session.response.end', function(session){
                    endedSessions.push(session);
                });
            });

            it('should end each started session',function(done){
                request.get('http://www.google.pl/', function(){
                    request.get('http://www.google.pl/', function(){
                        endedSessions.should.have.length(2);
                        endedSessions.should.contain(startedSessions[0]);
                        endedSessions.should.contain(startedSessions[1]);
                        done();
                    });
                });
            });
        });
    });

});
