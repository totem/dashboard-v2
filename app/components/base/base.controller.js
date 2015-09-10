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
          rawConfig: function (configService) {
            return configService.getRaw();
          },
          rawServices: function (configService) {
            return configService.getRawServices();
          }
        }
      });
  }])

  .controller('BaseController', function () {
  });
})();
