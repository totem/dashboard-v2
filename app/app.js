'use strict';

angular.module('totemDashboard', ['ngAnimate', 'ngSanitize', 'ngTable', 'ui.router', 'ui.bootstrap'])
  .config(function ($urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
  })
;
