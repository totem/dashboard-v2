(function () {
'use strict';

/*jshint strict: true */
/*globals angular*/

angular.module('totemDashboard')
  .config(['$stateProvider', function ($stateProvider) {
    $stateProvider
      .state('app', {
        abstract: true,
        url: '',
        controller: 'BaseController',
        templateUrl: 'components/base/base.html',
        resolve: {
          env: function (configService) {
            return configService.getRaw();
          }
        }
      });
  }])

  .controller('BaseController', function () {
  });
})();
