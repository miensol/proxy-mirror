(function(){

    var app = angular.module('proxyMirrorApp');
    app.controller('MainCtrl', function ($scope, sessionStorage) {
        $scope.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
        ];

        $scope.sessions = sessionStorage.sessions;
    });


}());

