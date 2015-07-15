(function () {
'use strict';

/*jshint strict: true */
/*globals angular*/

angular.module('totemDashboard')
.config(['$stateProvider', function($stateProvider) {
  $stateProvider
    .state('app.applications', {
      url: '/apps',
      views: {
        'main@app': {
          controller: 'ApplicationsContoller',
          templateUrl: 'components/applications/applications.html'
        }
      }
    });
}])

.controller('ApplicationsContoller', ['$scope', 'api', function($scope, api) {
  $scope.applications = {};

  $scope.hasBranch = function(branchName, app) {
    if (branchName in app.refs) {
      return true;
    } else {
      return false;
    }
  };

  $scope.load = function() {
    api.listApplications().then(function(results) {
      $scope.applications = results;
    });
  };

  $scope.load();
}]);

})();
