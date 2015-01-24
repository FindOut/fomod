'use strict';

/**
 * @ngdoc overview
 * @name fomodApp
 * @description
 * # fomodApp
 *
 * Main module of the application.
 */
angular
  .module('fomodApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'dr.sortable'
  ])
  .value('fbURL', 'https://fomod.firebaseio.com/')
  .service('fbref', function (fbURL) {
    return new Firebase(fbURL);
  })
  .config(function ($routeProvider) {
    $routeProvider
      .when('/models', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/objects/:id', {
        templateUrl: 'views/object.html',
        controller: 'ObjectCtrl'
      })
      .when('/templates/:id', {
        templateUrl: 'views/template.html',
        controller: 'TemplateCtrl'
      })
      .when('/templates', {
        templateUrl: 'views/template.html',
        controller: 'TemplateCtrl'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl'
      })
      .otherwise({
        redirectTo: '/login'
      });
  })
  .run(function(dataStore) {
    return dataStore;
  });
