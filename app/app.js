'use strict';

angular.module('totemDashboard', ['ngAnimate', 'ngSanitize', 'ui.router', 'ui.bootstrap'])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'components/base/base.html',
        controller: 'BaseCtrl'
      });

    $urlRouterProvider.otherwise('/');
  })
;
