(function () {
'use strict';

/*jshint strict: true */
/*globals angular,moment,_,$*/

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
  this.stages = function() {
    return ['clone', 'checkout', 'build', 'push'];
  };

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
          
          if(job.startTime) {
            job.startMoment = moment(job.startTime);
          }

          if (job.endTime) {
            job.endMoment = moment(job.endTime);
            job.duration = moment.duration(job.endMoment.diff(job.startMoment));
          }

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

.controller('ImageFactoryController', ['$state', '$scope', 'hotkeys', 'ImageFactory', function($state, $scope, hotkeys, ImageFactory) {

  hotkeys.bindTo($scope)
    .add({
      combo: 'r',
      description: 'reload',
      callback: function() {
        $scope.load();
      }
    })
    .add({
      combo: '/',
      description: 'filter',
      callback: function(event) {
        event.preventDefault();
        $('.searchRepo').focus();
      }
    })
    .add({
      combo: 'esc',
      allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
      callback: function(event) {
        event.preventDefault();
        $(event.srcElement).blur();
      }
    })
    .add({
      combo: 'n',
      description: 'Next page',
      callback: function() {
        $scope.page.set(1);
      }
    })
    .add({
      combo: 'p',
      description: 'Previous page',
      callback: function() {
        $scope.page.set(-1);
      }
    });

  $scope.data = {};

  $scope.predicate = 'startMoment';
  $scope.reverse = true;

  $scope.page = {
    current: 1,
    begin: 0,
    size: 20,
    total: 1,
    change: function() {
      $scope.page.begin = ($scope.page.current - 1) * $scope.page.size;
      $scope.page.total = ($scope.data.jobs) ? Math.ceil($scope.data.jobs.length / $scope.page.size) : 1;
    },
    set: function(adjust) {
      $scope.page.current = (adjust) ? $scope.page.current + adjust : 1;
      $scope.page.change();
    }
  };

  $scope.selectJob = function(job) {
    $state.go('app.image-factory-selected', {job: job.id});
  };

  $scope.load = function() {
    ImageFactory.list().then(function imageFactoryListSuccess(data) {
      $scope.data.jobs = data;
      $scope.page.set();
    });
  };

  $scope.load();
}])

.controller('ImageFactorySelectedController', ['$scope', '$state', 'hotkeys', 'ImageFactory', function($scope, $state, hotkeys, ImageFactory) {
  $scope.data = {};
  $scope.stages = ImageFactory.stages();

  hotkeys.bindTo($scope)
    .add({
      combo: 'r',
      description: 'reload',
      callback: function() {
        $scope.load();
      }
    })
    .add({
      combo: 'R',
      description: 'reload logs',
      callback: function() {
        $scope.loadLogs();
      }
    });

  $scope.load = function() {
    ImageFactory.job($state.params.job).then(function imageFactoryJobSuccess(data) {
      data.startMoment = moment(data.startTime);

      if (data.endTime) {
        data.endMoment = moment(data.endTime);
        data.duration = moment.duration(data.endMoment.diff(data.startMoment));
      }

      // Add a quay link to the tags page
      if (data.image && data.image.indexOf('quay.io') >= 0) {
        data.imageLink = 'https://' + data.image.split(':')[0] + '?tag=latest&tab=tags';
      }

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
