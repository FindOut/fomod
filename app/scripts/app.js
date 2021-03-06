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
    'dr.sortable',
    'firebase',
    'ngMaterial',
    'ngMessages'
  ])
  .value('fbURL', 'https://fomod.firebaseio.com/')
  .service('fbref', function(fbURL) {
    return new Firebase(fbURL);
  })
  .config(function($routeProvider) {
    $routeProvider
      .when('/models/:modelId', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/objects/:modelId/:objectId', {
        templateUrl: 'views/object.html',
        controller: 'ObjectCtrl'
      })
      .when('/templates/:modelId/:objectId', {
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
      .when('/models', {
        templateUrl: 'views/list.html',
        controller: 'ListCtrl'
      })
      .when('/new', {
        templateUrl: 'views/new.html',
        controller: 'NewCtrl'
      })
      .when('/random', {
        templateUrl: 'views/random.html',
        controller: 'RandomCtrl'
      })
      .otherwise({
        redirectTo: '/login'
      });
  })
  .run(function(dataStore) {
    return dataStore;
  });