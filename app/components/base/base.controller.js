(function () {
'use strict';

/*jshint strict: true */
/*globals angular*/

angular.module('totemDashboard')
  .config(function ($stateProvider) {
    $stateProvider
      .state('app', {
        abstract: true,
        url: '',
        controller: 'BaseController',
        templateUrl: 'components/base/base.html',
        resolve: {
          env: function (config) {
            return config.getRaw();
          }
        }
      });
  })

  .controller('BaseController', function () {
  });
})();
