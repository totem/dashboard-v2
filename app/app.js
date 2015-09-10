'use strict';

angular.module('totemDashboard', ['ngAnimate', 'ngSanitize', 'ngMessages', 'ngMaterial', 'ngWebSocket', 'ngStorage', 'ui.router', 'elasticsearch', 'jsonFormatter', 'gantt', 'gantt.tree'])
  .config(function ($urlRouterProvider) {
    // $urlRouterProvider.otherwise('/apps');
  })
;
