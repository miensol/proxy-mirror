(function(){

    var app = angular.module('proxyMirrorApp');

    var RequestViewModel = function(request) {
        this.headers = request.uniformHeaders();
        this.body = request.body;
    };

    var ResponseViewModel = function(response){
        this.headers = response.uniformHeaders();
        this.body = response.body;
    };

    app.controller('MainCtrl', function ($scope, sessionStorage) {
        $scope.sessions = sessionStorage.sessions;

        $scope.selectSession = function(session){
            if(sessionStorage.selectSession(session)){
                $scope.request = new RequestViewModel(session.request);
                $scope.response = new ResponseViewModel(session.response);
            }
        };
    });


}());

