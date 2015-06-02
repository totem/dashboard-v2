'use strict';

angular.module('totemDashboard', ['ngAnimate', 'ngSanitize', 'ngCookies', 'ui.router', 'ui.bootstrap', 'elasticsearch', 'angularMoment'])
  .config(function ($urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
  })
;
