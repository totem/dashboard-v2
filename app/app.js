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
  .run(['$rootScope', '$log', '$mdDialog', function($rootScope, $log, $mdDialog) {
    $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
      $log.error('$stateChangeError', event, toState, toParams, fromState, fromParams, error);

      $mdDialog.show(
        $mdDialog.alert()
          .clickOutsideToClose(true)
          .title('Error!')
          .textContent(error)
          .ariaLabel('Application Error Alert')
          .ok('Ok')
          .targetEvent(event)
      );
    });

  }])
;
