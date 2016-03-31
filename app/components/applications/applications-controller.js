(function () {
'use strict';

/*jshint strict: true */
/*globals angular,$*/

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

.controller('ApplicationsContoller', ['$state', '$scope', 'hotkeys', 'api', function($state, $scope, hotkeys, api) {
  $scope.data = {};

  $scope.sort = {
    predicate: 'id',
    reverse: false,
    change: function(predicate) {
      $scope.sort.reverse = ($scope.sort.predicate === predicate) ? !$scope.sort.reverse : false;
      $scope.sort.predicate = predicate;
    }
  };

  hotkeys.bindTo($scope)
    .add({
      combo: '/',
      description: 'filter',
      callback: function(event) {
        event.preventDefault();
        $('.searchAll').focus();
      }
    })
    .add({
      combo: 'esc',
      allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
      callback: function(event) {
        event.preventDefault();
        $(event.srcElement).blur();
      }
    });

  $scope.firstRef = function(app) {
    return _.first(_.keys(app.refs).sort());
  }

  $scope.changeState = function(eve, app, ref) {
    if (!ref) {
      ref = 'develop';

      // if there's no develop, check for master
      if (app.refs && (!app.refs.develop && app.refs.master)) {
        ref = 'master';
      }
      else {
        // If there's no master either, get the first ref based on sorted to provide deterministic behaviour.
        ref = $scope.firstRef(app);
      }
    }

    eve.stopPropagation();
    $state.go('app.applicationsSelected.summary', {
      owner: app.owner,
      repo: app.repo,
      ref: ref
    });
  };

  $scope.load = function() {
    api.listApplications().then(function(results) {
      $scope.data.applications = results;
    });
  };

  $scope.load();
}]);

})();
