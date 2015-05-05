'use strict';

angular.module('totemDashboard')
  .config(function ($stateProvider) {
    $stateProvider
      .state('base', {
        url: '/',
        templateUrl: 'components/base/base.html',
        controller: 'BaseCtrl'
      });
  })

  .controller('BaseCtrl', function () {

  })
;
