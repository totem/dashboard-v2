'use strict';

angular.module('totemDashboard', ['ngAnimate', 'ngSanitize', 'ngMessages', 'ngMaterial', 'ngWebSocket', 'ui.router', 'elasticsearch', 'jsonFormatter'])
  .config(function ($urlRouterProvider) {
    $urlRouterProvider.otherwise('/apps');
  })
;
