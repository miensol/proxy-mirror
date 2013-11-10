(function(){

    var app = angular.module('proxyMirrorApp');

    var RequestViewModel = function(request) {
        this.headers = request.uniformHeaders();
    };

    var ResponseViewModel = function(response){
        this.headers = response.uniformHeaders();
    };

    app.controller('MainCtrl', function ($scope, sessionStorage) {
        $scope.sessions = sessionStorage.sessions;

        $scope.selectSession = function(session){
            sessionStorage.selectSession(session);
            $scope.request = new RequestViewModel(session.request);
            $scope.response = new ResponseViewModel(session.response);
        };
    });


}());

