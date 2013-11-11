(function(){

    var app = angular.module('proxyMirrorApp');

    var RequestViewModel = function(request) {
        this.headers = request.uniformHeaders();
        this.bodyAsString = request.bodyAsString;
        this.bodyAsBase64 = request.bodyAsBase64;
    };

    var ResponseViewModel = function(response, $sce){
        this.headers = response.uniformHeaders();
        this.bodyAsString = response.bodyAsString;
        this.bodyAsBase64 = response.bodyAsBase64;
        this.displayAsIframe = !!this.bodyAsBase64;
        this.iframeSrc = ['data:', this.headers['Content-Type'],';base64, ', this.bodyAsBase64].join('')
        this.iframeSrc = $sce.trustAsResourceUrl(this.iframeSrc);
    };

    app.controller('MainCtrl', function ($scope,$sce, sessionStorage) {
        $scope.sessions = sessionStorage.sessions;

        $scope.selectSession = function(session){
            if(sessionStorage.selectSession(session)){
                $scope.request = new RequestViewModel(session.request);
                $scope.response = new ResponseViewModel(session.response, $sce);
            }
        };
    });


}());

