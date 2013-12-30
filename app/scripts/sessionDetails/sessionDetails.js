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

    var IframeSrcFromBody = function($sce, asBase64){
        var headers = this.headers || {};
        this.displayAsIframe = !!asBase64;
        this.iframeSrc = ['data:', headers['Content-Type'], ';base64, ', asBase64].join('');
        this.iframeSrc = $sce.trustAsResourceUrl(this.iframeSrc);
    };

    var ClearCommonMessageProperties = function(){
        this.statusCode = null;
        this.statusMsg = null;
        this.displayAsIframe = false;
        this.iframeSrc = null;
        this.headers = null;
        this.body = {
            asBase64: null,
            asString: null,
            asUncompressedBase64: null,
            asUncompressedString: null
        };
        this.httpVersion = null;
        this.url = null;
        this.urlObj = null;
        this.method = null;
    };

    var MessageBody = function($sce){
        var that = this,
            isSwitched = false;
        that.isBodyCompressed = function(){
            var headers = that.headers || {};
            var contentEncoding = headers['Content-Encoding'] || '';
            return contentEncoding == 'gzip' || contentEncoding == 'deflate';
        };
        that.isSwitchedToUncompressed = function(){
            return isSwitched;
        };
        that.bodyAsBase64 = function(){
            if(isSwitched){
                return that.body.asUncompressedBase64;
            } else {
                return that.body.asBase64;
            }
        };
        that.bodyAsString = function(){
            if(isSwitched){
                return that.body.asUncompressedString;
            } else {
                return that.body.asString;
            }
        };
        that.toggleUncompressedMode = function(){
            isSwitched = !isSwitched;
            IframeSrcFromBody.call(this, $sce, that.bodyAsBase64());
        };
        IframeSrcFromBody.call(that, $sce, that.bodyAsBase64());
    };

    var RequestViewModel = function($sce){
        ClearCommonMessageProperties.call(this);
        MessageBody.call(this, $sce);
        this.loadRequest = function(request){
            ClearCommonMessageProperties.call(this);
            angular.extend(this, request);
        }
    };

    var ResponseViewModel = function ($sce) {
        ClearCommonMessageProperties.call(this);
        MessageBody.call(this, $sce);
        this.loadResponse = function(response){
            ClearCommonMessageProperties.call(this);
            angular.extend(this, response);
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
