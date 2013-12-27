'use strict';

angular.module('proxyMirrorApp', [
  'proxyMirrorApp.proxyClient',
  'proxyMirrorApp.sessions',
  'ngGrid',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ui.bootstrap'
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
