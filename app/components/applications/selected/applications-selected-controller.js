(function () {
'use strict';

/*jshint strict: true */
/*globals _,angular*/

angular.module('totemDashboard')
.config(['$stateProvider', function($stateProvider) {
  $stateProvider
    .state('app.applicationsSelected', {
      url: '/apps/:owner/:repo/:ref',
      views: {
        'main@app': {
          controller: 'ApplicationsSelectedContoller',
          templateUrl: 'components/applications/selected/applications-selected.html'
        }
      }
    });
}])

.controller('ApplicationsSelectedContoller', ['$scope', '$stateParams', 'api', function($scope, $stateParams, api) {
  $scope.application = null;
  $scope.events = [];

  $scope.selected = {
    deployment: null
  };

  function getNodes(deployment) {
    var nodes = [];
    try {
      for (var i = 0; i < deployment.deployment.nodes; i++) {
        nodes.push({
          id: i,
          name: 'node' + (i + 1)
        });
      }
    } catch(err) {}

    return nodes;
  }

  $scope.$watch('selected.deployment', function(deployment) {
    if (_.isUndefined(deployment) || _.isNull(deployment)) {
      return;
    }

    // TODO: Remove once node information is in the document.
    deployment.nodes = getNodes(deployment);

    // try and set a default hostname for each proxy item
    _.each(deployment.proxyMeta || {}, function(item) {
      try {
        item._choosenHostname = item.hostnames[item.hostnames.length - 1];
      } catch(err){}
    });

    api.getJobEvents(deployment.metaInfo.jobId).then(function(results) {
      $scope.events = results;
    });
  });

  $scope.isPublicACL = function(location) {
    if (location['allowed-acls'].indexOf('public') !== -1) {
      return true;
    }

    return false;
  };

  $scope.load = function() {
    api.getApplication($stateParams.owner, $stateParams.repo, $stateParams.ref).then(function(results) {
      $scope.application = results;
      $scope.application.ref = results.refs[$stateParams.ref];

      $scope.selected.deployment = results.ref.deployments[0];
    });
  };

  $scope.load();
}]);

})();
