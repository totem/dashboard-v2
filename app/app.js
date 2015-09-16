'use strict';

angular.module('totemDashboard', ['ngAnimate', 'ngSanitize', 'ngMessages', 'ngMaterial', 'ngWebSocket', 'ui.router', 'elasticsearch', 'jsonFormatter', 'gantt', 'gantt.tree'])
  .config(function ($urlRouterProvider) {
    $urlRouterProvider.when('', '/apps');
  })
;
