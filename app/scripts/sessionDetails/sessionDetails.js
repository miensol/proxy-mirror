(function () {
    var module = angular.module('proxyMirrorApp.sessionDetails', ['proxyMirrorApp.headers']);

    module.directive('pmRequestDetails', function () {
        return {
            replace: true,
            restrict: 'EA',
            scope: true,
            templateUrl: 'scripts/sessionDetails/requestDetails.html'
        };
    });

    var watchForSelectedSession = function ($scope, sessionStorage, callback) {
        $scope.$watch(function () {
            return sessionStorage.selectedSession;
        }, function (session) {
            if (session) {
                callback(session);
            }
        });
    };

    var IframeSrcFromBody = function($sce){
        var headers = this.headers || {};
        this.displayAsIframe = !!this.bodyAsBase64;
        this.iframeSrc = ['data:', headers['Content-Type'], ';base64, ', this.bodyAsBase64].join('');
        this.iframeSrc = $sce.trustAsResourceUrl(this.iframeSrc);
    };

    var ClearCommonMessageProperties = function(){
        this.statusCode = null;
        this.statusMsg = null;
        this.displayAsIframe = false;
        this.iframeSrc = null;
        this.headers = null;
        this.bodyAsBase64 = null;
        this.bodyAsString = null;
    };

    var RequestViewModel = function($sce){
        ClearCommonMessageProperties.call(this);
        this.loadRequest = function(request){
            ClearCommonMessageProperties.call(this);
            angular.extend(this, request);
            IframeSrcFromBody.call(this, $sce);
        }
    };

    var ResponseViewModel = function ($sce) {
        ClearCommonMessageProperties.call(this);
        this.loadResponse = function(response){
            ClearCommonMessageProperties.call(this);
            angular.extend(this, response);
            IframeSrcFromBody.call(this, $sce);
        }
    };

    var SelectView = function () {
        var $scope = this;
        $scope.availableViews = [];
        $scope.updateAvailableViews = function (newViews) {
            $scope.availableViews = newViews.map(function (view) {
                if (!view.init) {
                    view.init = function () {
                    };
                }
                return view;
            }).filter(function (view) {
                    return view.visible;
                });
            var viewToSelect = $scope.availableViews[0];
            if ($scope.selectedView) {
                //TODO: this only works because we're referencing responseviewmodel and requestviewmodel which are the same
                viewToSelect = $scope.availableViews.filter(function(view){
                    return view.title === $scope.selectedView.title;
                })[0] || viewToSelect;
            }
            $scope.selectView(viewToSelect);
        };
        $scope.selectedView = null;
        $scope.selectView = function (view) {
            $scope.selectedView = view;
        };
        $scope.classForView = function (view) {
            if (view === $scope.selectedView) {
                return 'active';
            }
            return '';
        };
    };

    module.controller('RequestDetailsCtrl', function ($scope,$sce, sessionStorage) {
        $scope.request = new RequestViewModel($sce);
        var updateAvailableViews = function () {
            var availableViews = [
                {
                    visible: true,
                    title: 'Headers',
                    templateUrl: 'scripts/sessionDetails/requestHeaders.html'
                },
                {
                    title: 'Body as Text',
                    templateUrl: 'scripts/sessionDetails/bodyAsString.html',
                    visible: !!$scope.request.bodyAsString,
                    init: function ($childScope) {
                        $childScope.message = $scope.request;
                    }
                }
            ];
            $scope.updateAvailableViews(availableViews);
        };
        watchForSelectedSession($scope, sessionStorage, function (session) {
            $scope.request.loadRequest(session.request);
            updateAvailableViews();
        });

        SelectView.call($scope);
    });

    module.directive('pmResponseDetails', function () {
        return {
            replace: true,
            restrict: 'EA',
            templateUrl: 'scripts/sessionDetails/responseDetails.html'
        };
    });

    module.controller('ResponseDetailsCtrl', function ($scope, $sce, sessionStorage) {
        $scope.response = new ResponseViewModel($sce);
        var updateAvailableViews = function () {
            var availableViews = [
                {
                    title: 'Headers',
                    templateUrl: 'scripts/sessionDetails/responseHeaders.html',
                    visible: true,
                    init: function ($childScope) {
                    }
                },
                {
                    title: 'Body as Text',
                    templateUrl: 'scripts/sessionDetails/bodyAsString.html',
                    visible: !!$scope.response.bodyAsString,
                    init: function ($childScope) {
                        $childScope.message = $scope.response;
                    }
                },
                {
                    title: 'Preview',
                    templateUrl: 'scripts/sessionDetails/bodyAsIframe.html',
                    visible: $scope.response.displayAsIframe,
                    init: function ($childScope) {
                        $childScope.message  = $scope.response;
                    }
                }
            ];
            $scope.updateAvailableViews(availableViews);
        };

        watchForSelectedSession($scope, sessionStorage, function (session) {
            $scope.response.loadResponse(session.response);
            updateAvailableViews();
        });

        SelectView.call($scope);
    });

}());
