'use strict';

angular.module('proxyMirrorApp', [
        'ngGrid',
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'ngRoute',
        'ui.bootstrap',
        'proxyMirrorApp.proxyClient',
        'proxyMirrorApp.sessions',
        'proxyMirrorApp.headers'
    ]).config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'scripts/main.html',
                controller: 'MainCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
    });
