(function () {
'use strict';

/*jshint strict: true */
/*globals angular*/

angular.module('totemDashboard')
.config(['$stateProvider', function($stateProvider) {
  $stateProvider
    .state('app.addHooks', {
      url: '/add',
      views: {
        'main@app': {
          controller: 'AddHooksController',
          templateUrl: 'components/add-hooks/add-hooks.html'
        }
      }
    });
}])

.controller('AddHooksController', ['$scope', '$http', '$localStorage', 'githubAuth', function($scope, $http, $localStorage, githubAuth) {
  $scope.$storage = $localStorage;
  $scope.authError = false;

  $scope.authGithub = function () {
    githubAuth.authorize().then(function (token) {
      $scope.authError = false;
      $scope.$storage.githubAuthToken = token;
    }).catch(function () {
      $scope.authError = true;
      delete $scope.$storage.githubAuthToken;
    });
  };

  $scope.logout = function () {
    delete $scope.$storage.githubAuthToken;
  };

  $scope.addHooks = function (user, repo) {
    var req = {
      method: 'POST',
      url: 'https://c8cab2fe.ngrok.io/add/' + user + '/' + repo,
      headers: {
        Authorization: 'Bearer ' + $scope.$storage.githubAuthToken
      }
    };

    $http(req).then(function () {
      console.log('hooks added!');
    }).catch(function () {
      console.log('adding hooks failed = (');
    });
  };
}]);

})();
