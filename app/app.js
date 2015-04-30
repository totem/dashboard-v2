'use strict';

angular.module('totemDashboard', ['ngAnimate', 'ngSanitize', 'ngTable', 'ui.router', 'ui.bootstrap', 'elasticsearch'])
  .config(function ($urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
  })
;
