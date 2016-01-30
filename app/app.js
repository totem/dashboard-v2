'use strict';

angular.module('totemDashboard', ['ngAnimate', 'ngSanitize', 'ngMessages', 'ngMaterial', 'ngWebSocket', 'ui.router', 'elasticsearch', 'jsonFormatter', 'gantt', 'gantt.tree', 'gantt.table', 'gantt.groups', 'gantt.tooltips'])
  .config(function ($urlRouterProvider) {
    $urlRouterProvider.when('', '/apps');
  })
  .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('blue-grey')
      .accentPalette('orange');
  })
;
