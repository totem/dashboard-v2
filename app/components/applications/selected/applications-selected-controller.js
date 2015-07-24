(function () {
'use strict';

/*jshint strict: true */
/*globals _,angular,moment,console,$,document*/

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

.directive('humandate', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$validators.humandate = function(modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          // consider empty models to be valid
          return true;
        }

        if (Date.parse(viewValue) !== null) {
          return true;
        }

        // it is invalid
        return false;
      };
    }
  };
})

.controller('ApplicationsSelectedContoller', ['$document', '$scope', '$stateParams', '$websocket', '$mdToast', 'api', 'logs', function($document, $scope, $stateParams, $websocket, $mdToast, api, logService) {
  $scope.application = null;
  $scope.events = [];
  $scope.logs = {
    date: '',
    interval: 5,
    program: '',
    running: false,
    status: null,
    messages: [],
    scroll: true,
    viewing: false,
    showTimestamp: false,
    filter: {}
  };

  $scope.selected = {
    deployment: null
  };

  // TODO: Temporary function until node details are added to the document
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

  function logScroll() {
    if ($scope.logs.scroll) {
      angular.element('html, body').animate({
         scrollTop: $(document).height() + angular.element('#log-messages').offset().top
      }, 'slow');
    }
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

  $scope.stopLogs = function() {
    if ($scope.websocket) {
      $scope.websocket.close();
    }
    $scope.logs.running = false;
  };

  $scope.startLogs = function() {
    $scope.websocket = logService.connect();

    $scope.websocket.onOpen(function() {
      $scope.logs.running = true;
      $scope.websocket.send(JSON.stringify({
        'after-date': Date.parse($scope.logs.date),
        interval: $scope.logs.interval,
        'meta-info': {
          git: {
            owner: $stateParams.owner,
            repo: $stateParams.repo,
            ref: $stateParams.ref
          },
          'program-name': $scope.logs.program
        }
      }));
    });

    $scope.websocket.onMessage(function(message) {
      var data = JSON.parse(message.data);

      if (data.type === 'LOGS') {
        _.each(data.details.logs, function(line) {
          line.date = moment(line.timestamp, 'YYYY-MM-DDTHH:mm:ssZ');
          $scope.logs.messages.push(line);
        });
        logScroll();

        return;
      }

      if (data.type === 'FAILED') {
        $scope.logs.running = false;
      }

      $scope.logs.status = data;
    });

    $scope.websocket.onClose(function() {
      $scope.logs.running = false;
    });
  };

  $scope.load = function() {
    api.getApplication($stateParams.owner, $stateParams.repo, $stateParams.ref).then(function(results) {
      $scope.application = results;
      $scope.application.ref = results.refs[$stateParams.ref];

      $scope.selected.deployment = results.ref.deployments[0];
    }, function(error) {
      $mdToast.show($mdToast.simple().position('top left').content('Error Getting Application!'));
      console.error(error);
    });
  };

  $scope.load();
}]);

})();
