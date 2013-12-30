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

    var ResponseViewModel = function(response, $sce){
        angular.extend(this, response);
        var headers = this.headers || {};
        this.displayAsIframe = !!this.bodyAsBase64;
        this.iframeSrc = ['data:', headers['Content-Type'],';base64, ', this.bodyAsBase64].join('');
        this.iframeSrc = $sce.trustAsResourceUrl(this.iframeSrc);
    };

    var SelectView = function(){
        var $scope = this;
        $scope.selectedView = null;
        $scope.selectView = function(view){
            $scope.selectedView = view;
        };
        $scope.classForView = function(view){
            if(view === $scope.selectedView){
                return 'active';
            }
            return '';
        };
    };

    module.controller('RequestDetailsCtrl', function($scope, sessionStorage){
        $scope.request = null;
        var updateAvailableViews = function(){
            $scope.availableViews = [{
                title: 'Headers',
                templateUrl: 'scripts/sessionDetails/requestHeaders.html'
            }];
            $scope.selectView($scope.availableViews[0]);
        };
        watchForSelectedSession($scope, sessionStorage, function(session){
            $scope.request = session.request;
            updateAvailableViews();
        });

        SelectView.call($scope);
    });

    module.directive('pmResponseDetails', function(){
       return {
           replace: true,
           restrict: 'EA',
           templateUrl: 'scripts/sessionDetails/responseDetails.html'
       };
    });

    module.controller('ResponseDetailsCtrl', function($scope,$sce, sessionStorage){
        $scope.response = null;
        var updateAvailableViews = function(){
            $scope.availableViews = [{
                title: 'Headers',
                templateUrl: 'scripts/sessionDetails/responseHeaders.html',
                visible: true,
                init: function($childScope){}
            }, {
                title: 'Body as Text',
                templateUrl: 'scripts/sessionDetails/bodyAsString.html',
                visible: !!$scope.response.bodyAsString,
                init: function($childScope){
                    $childScope.bodyAsString = $scope.response.bodyAsString;
                }
            }, {
                title: 'Preview',
                templateUrl: 'scripts/sessionDetails/bodyAsIframe.html',
                visible: $scope.response.displayAsIframe,
                init: function($childScope){
                    $childScope.iframeSrc = $scope.response.iframeSrc;
                }
            }].filter(function(view){return view.visible;});
            $scope.selectView($scope.availableViews[0]);
        };

        watchForSelectedSession($scope, sessionStorage, function(session){
            $scope.response = new ResponseViewModel(session.response, $sce);
            updateAvailableViews();
        });

        SelectView.call($scope);
    });

}());
