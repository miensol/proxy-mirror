(function(){
    var module = angular.module('proxyMirrorApp.headers',[]);

    module.directive('pmHeadersTable', function(){
        return {
            replace: true,
            restrict: 'EA',
            scope: {
                headers:'='
            },
            templateUrl:'scripts/headers/headersTable.html'
        }
    });

}());
