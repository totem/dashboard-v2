(function () {
'use strict';

/*jshint strict: true */
/*globals angular, moment*/

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

  .controller('BaseController', ['$scope', function ($scope) {
    $scope.moment = moment;
  }]);
})();
