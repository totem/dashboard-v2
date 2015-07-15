'use strict';

angular.module('totemDashboard', ['ngAnimate', 'ngSanitize', 'ngMaterial', 'ui.router', 'elasticsearch', 'jsonFormatter'])
  .config(function ($urlRouterProvider) {
    $urlRouterProvider.otherwise('/apps');
  })
;
