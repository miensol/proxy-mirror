(function(){

    var app = angular.module('proxyMirrorApp');

    var ResponseViewModel = function(response, $sce){
        angular.extend(this, response);
        var headers = this.headers || {};
        this.displayAsIframe = !!this.bodyAsBase64;
        this.iframeSrc = ['data:', headers['Content-Type'],';base64, ', this.bodyAsBase64].join('');
        this.iframeSrc = $sce.trustAsResourceUrl(this.iframeSrc);
    };

    app.controller('MainCtrl', function ($scope, $sce, sessionStorage) {
        $scope.$watch(function(){
            return sessionStorage.selectedSession;
        }, function(session){
            if(session){
                $scope.request = session.request;
                $scope.response = new ResponseViewModel(session.response, $sce);
            }
        });
    });


}());

