(function(){
    var module = angular.module('proxyMirrorApp.sessionDetails', ['proxyMirrorApp.headers']);

    module.directive('pmRequestDetails', function(){
       return {
           replace: true,
           restrict: 'EA',
           scope: true,
           templateUrl: 'scripts/sessionDetails/requestDetails.html'
       };
    });

    var watchForSelectedSession = function($scope,sessionStorage,callback){
        $scope.$watch(function(){
            return sessionStorage.selectedSession;
        }, function(session){
            if(session){
                callback(session);
            }
        });
    };

    module.controller('RequestDetailsCtrl', function($scope, sessionStorage){
        $scope.request = null;
        watchForSelectedSession($scope, sessionStorage, function(session){
            $scope.request = session.request;
        });
    });

    module.directive('pmResponseDetails', function(){
       return {
           replace: true,
           restrict: 'EA',
           templateUrl: 'scripts/sessionDetails/responseDetails.html'
       };
    });

    module.controller('ResponseDetailsCtrl', function($scope, sessionStorage){
        $scope.response = null;
        watchForSelectedSession($scope, sessionStorage, function(session){
            $scope.response = session.response;
        });
    });

}());
