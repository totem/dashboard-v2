'use strict';

angular.module('totemDashboard')
  .config(function ($stateProvider) {
    $stateProvider
      .state('base', {
        url: '/',
        templateUrl: 'components/base/base.html',
        controller: 'BaseCtrl',
        resolve: {
          env: function (config) {
            return config.getRaw();
          }
        }
      });
  })

  .controller('BaseCtrl', function () {

  })
;
