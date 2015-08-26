'use strict';

angular.module('totemDashboard', ['ngAnimate', 'ngSanitize', 'ngMessages', 'ngMaterial', 'ngWebSocket', 'ui.router', 'elasticsearch', 'jsonFormatter', 'gantt'])
  .config(function ($urlRouterProvider) {
    $urlRouterProvider.otherwise('/apps');
  })
;
