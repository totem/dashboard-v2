'use strict';

angular.module('totemDashboard', ['angular-loading-bar', 'ngAnimate', 'ngSanitize', 'ngMessages', 'ngMaterial', 'ngWebSocket', 'ui.router', 'elasticsearch', 'jsonFormatter', 'gantt', 'gantt.tree', 'gantt.table', 'gantt.groups', 'gantt.tooltips', 'cfp.hotkeys'])
  .config(function ($urlRouterProvider) {
    $urlRouterProvider.when('', '/apps');
  })
  .config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('blue-grey')
      .accentPalette('orange');
  })
  .config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
  }])
;
