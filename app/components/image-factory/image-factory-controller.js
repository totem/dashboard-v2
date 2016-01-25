(function () {
'use strict';

/*jshint strict: true */
/*globals angular,moment,_*/

angular.module('totemDashboard')
.config(['$stateProvider', function($stateProvider) {
  $stateProvider
    .state('app.image-factory', {
      url: '/image-factory',
      views: {
        'main@app': {
          controller: 'ImageFactoryController',
          templateUrl: 'components/image-factory/image-factory.html'
        }
      }
    });

  $stateProvider
    .state('app.image-factory-selected', {
      url: '/image-factory/:job',
      views: {
        'main@app': {
          controller: 'ImageFactorySelectedController',
          templateUrl: 'components/image-factory/image-factory-selected.html'
        }
      }
    });
}])

.service('ImageFactory', ['$q', '$http', 'config', function($q, $http, config) {
  this.job = function(jobId) {
    var deferred = $q.defer();

    $http({
      method: 'GET',
      url: config.imageFactory.url + '/job/' + jobId
    }).then(function successCallback(response) {
      deferred.resolve(response.data || {});
    }, function errorCallback(response) {
      deferred.reject(response);
    });

    return deferred.promise;
  };

  this.list = function() {
    var deferred = $q.defer();

    $http({
      method: 'GET',
      url: config.imageFactory.url + '/job'
    }).then(function successCallback(response) {
        _.each(response.data, function(job) {
          job.startMoment = moment(job.startTime);
          job.endMoment = moment(job.endTime);
          job.repositoryDetails = job.context.owner + '/' + job.context.repo + '/' + job.context.branch;
        });

        deferred.resolve(response.data || []);
      }, function errorCallback(response) {
        deferred.reject(response);
      });

    return deferred.promise;
  };

  this.logs = function(jobId) {
    var deferred = $q.defer();

    $http({
      method: 'GET',
      url: config.imageFactory.url + '/job/' + jobId + '/log'
    }).then(function successCallback(response) {
      deferred.resolve(response.data);
    }, function errorCallback(response) {
      deferred.reject(response);
    });

    return deferred.promise;
  };
}])

.controller('ImageFactoryController', ['$state', '$scope', 'ImageFactory', function($state, $scope, ImageFactory) {
  $scope.data = {};

  $scope.limitCount = 20;
  $scope.predicate = 'startMoment';
  $scope.reverse = true;

  $scope.selectJob = function(job) {
    $state.go('app.image-factory-selected', {job: job.id});
  };

  $scope.load = function() {
    ImageFactory.list().then(function imageFactoryListSuccess(data) {
      $scope.data.jobs = data;
    });
  };

  $scope.load();
}])

.controller('ImageFactorySelectedController', ['$scope', '$state', 'ImageFactory', function($scope, $state, ImageFactory) {
  $scope.data = {};

  $scope.load = function() {
    ImageFactory.job($state.params.job).then(function imageFactoryJobSuccess(data) {
      data.startMoment = moment(data.startTime);
      data.endMoment = moment(data.endTime);

      $scope.job = data;
    });
  };

  $scope.loadLogs = function() {
    ImageFactory.logs($state.params.job).then(function logsSuccess(data) {
      $scope.logs = data;
    });
  };

  $scope.load();
  $scope.loadLogs();
}])
;

})();
