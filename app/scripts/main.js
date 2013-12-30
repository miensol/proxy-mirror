(function(){

    var app = angular.module('proxyMirrorApp');
    var noop = function(){};

    app.directive('pmInclude', ['$http', '$templateCache', '$anchorScroll', '$compile', '$animate', '$sce', '$parse',
        function($http,   $templateCache,   $anchorScroll,   $compile,   $animate,   $sce, $parse) {
            return {
                restrict: 'ECA',
                priority: 400,
                terminal: true,
                transclude: 'element',
                compile: function(element, attr) {
                    var srcExp = attr.pmInclude || attr.src,
                        onloadExp = attr.onload || '',
                        onchildloadExp = attr.childInit || '',
                        autoScrollExp = attr.autoscroll;

                    return function(scope, $element, $attr, ctrl, $transclude) {
                        var changeCounter = 0,
                            currentScope,
                            currentElement;

                        var cleanupLastIncludeContent = function() {
                            if (currentScope) {
                                currentScope.$destroy();
                                currentScope = null;
                            }
                            if(currentElement) {
                                $animate.leave(currentElement);
                                currentElement = null;
                            }
                        };

//                        scope.$watch(srcExp, function pmIncludeWatchAction(src) {
                        scope.$watch($sce.parseAsResourceUrl(srcExp), function ngIncludeWatchAction(src) {
                            var afterAnimation = function() {
                                if (angular.isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                                    $anchorScroll();
                                }
                            };
                            var thisChangeId = ++changeCounter;

                            if (src) {
                                $http.get(src, {cache: $templateCache}).success(function(response) {
                                    if (thisChangeId !== changeCounter) return;
                                    var newScope = scope.$new();

                                    // Note: This will also link all children of ng-include that were contained in the original
                                    // html. If that content contains controllers, ... they could pollute/change the scope.
                                    // However, using ng-include on an element with additional content does not make sense...
                                    // Note: We can't remove them in the cloneAttchFn of $transclude as that
                                    // function is called before linking the content, which would apply child
                                    // directives to non existing elements.
                                    var clone = $transclude(newScope, noop);
                                    cleanupLastIncludeContent();

                                    currentScope = newScope;
                                    currentElement = clone;

                                    currentElement.html(response);
                                    $animate.enter(currentElement, null, $element, afterAnimation);
                                    $compile(currentElement.contents())(currentScope);
                                    currentScope.$emit('$includeContentLoaded');
                                    scope.$eval(onloadExp);
                                    var childInitFunc = currentScope.$eval(onchildloadExp);
                                    if(typeof childInitFunc === 'function'){
                                        childInitFunc(currentScope);
                                    }
                                }).error(function() {
                                        if (thisChangeId === changeCounter) cleanupLastIncludeContent();
                                    });
                                scope.$emit('$includeContentRequested');
                            } else {
                                cleanupLastIncludeContent();
                            }
                        });
                    };
                }
            };
        }]
    );



    app.controller('MainCtrl', function ($scope, $sce, sessionStorage) {

    });


}());

