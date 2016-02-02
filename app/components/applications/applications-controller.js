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
  $scope.data = {};


  $scope.sort = {
    predicate: 'id',
    reverse: false,
    change: function(predicate) {
      $scope.sort.reverse = ($scope.sort.predicate === predicate) ? !$scope.sort.reverse : false;
      $scope.sort.predicate = predicate;
    }
  };

  $scope.load = function() {
    api.listApplications().then(function(results) {
      $scope.data.applications = results;
    });
  };

  $scope.load();
}]);

})();
