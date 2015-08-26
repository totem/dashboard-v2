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

.controller('ApplicationsSelectedContoller', ['$document', '$scope', '$stateParams', '$websocket', '$mdToast', '$window', '$location', 'api', 'logs', function($document, $scope, $stateParams, $websocket, $mdToast, $window, $location, api, logService) {
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

  function getNodes(deployment) {
    var machines = {};

    for (var i = 0; i < deployment.runtime.units.length; i++) {
      var unit = deployment.runtime.units[i];

      if (unit.unit.indexOf('app') === -1) {
        break;
      }

      var address = unit.machine.split('/')[1],
          id = unit.machine.split('/')[0],
          upstreamKeyArr = unit.unit.split('@'),
          upstreamKey = upstreamKeyArr[0] + '-' + upstreamKeyArr[1].split('.')[0];

      machines[address] = machines[address] || {
        id: id,
        address: address,
        units: [],
        upstreams: {}
      };

      machines[address].units.push(_.cloneDeep(unit));

      for (var upstream in deployment.runtime.upstreams) {
        machines[address].upstreams[upstream] = deployment.runtime.upstreams[upstream][upstreamKey].split(':')[1];
      }
    }

    return _.valuesIn(machines);
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

    api.getJobEvents(deployment.metaInfo.jobId).then(function(results) {
      $scope.events = results;
    });
  });

  $scope.isPublicACL = function(location) {
    if (location && location['allowed-acls'].indexOf('public') !== -1) {
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

  $scope.deleteDeployment = function (deployment) {
    $scope.working = true;
    api.deleteDeployment(deployment.deployment.name, deployment.metaInfo.deployer.url).then(function () {
      $scope.working = false;
      $scope.selected.deployment.decomissionStarted = true;
    });
  };

  $scope.open = function (location) {
    $window.open('http://' + location.hostname + location.path);
  };

  $scope.$watch('events.events', function (events) {
    var data = [],
        clusters = {},
        newDeploymentEvents = _.where(events, {type: 'NEW_DEPLOYMENT'}),
        nodesDiscoveredEvents = _.where(events, {type: 'NODES_DISCOVERED'}),
        deploymentCheckEvents = _.where(events, {type: 'DEPLOYMENT_CHECK_PASSED'}),
        wiredEvents = _.where(events, {type: 'WIRED'}),
        promotedEvents = _.where(events, {type: 'PROMOTED'});

    _.each(newDeploymentEvents, function (newDeploymentEvent) {
      clusters[newDeploymentEvent.metaInfo.deployer.cluster] = {
        deploy: {start: newDeploymentEvent}
      };
    });

    _.each(nodesDiscoveredEvents, function (nodesDiscoveredEvent) {
      var cluster = clusters[nodesDiscoveredEvent.metaInfo.deployer.cluster];
      cluster.deploy.end = nodesDiscoveredEvent;
      cluster.validate = {
        start: nodesDiscoveredEvent
      };
    });

    _.each(deploymentCheckEvents, function (deploymentCheckEvent) {
      var cluster = clusters[deploymentCheckEvent.metaInfo.deployer.cluster];
      cluster.validate.end = deploymentCheckEvent;
      cluster.wire = {
        start: deploymentCheckEvent
      };
    });

    _.each(wiredEvents, function (wiredEvent) {
      var cluster = clusters[wiredEvent.metaInfo.deployer.cluster];
      cluster.wire.end = wiredEvent;
      cluster.cleanup = {
        start: wiredEvent
      };
    });

    _.each(promotedEvents, function (promotedEvent) {
      clusters[promotedEvent.metaInfo.deployer.cluster].cleanup.end = promotedEvent;
    });

    _.each(clusters, function (cluster, clusterName) {
      var row = {
        name: clusterName,
        tasks: []
      };

      _.each(cluster, function (deploymentEvent, eventName) {
        if (deploymentEvent.end && !deploymentEvent.start) {
          deploymentEvent.start = deploymentEvent.end;
        }

        if (deploymentEvent.start && deploymentEvent.end) {
          row.tasks.push({
            name: eventName,
            classes: [eventName],
            from: deploymentEvent.start.moment,
            to: deploymentEvent.end.moment
          });
        }
      });

      data.push(row);
    });

    $scope.ganttData = data;

    try {
      $scope.ganttTimespan = {
        from: events[events.length - 1].moment,
        to: events[0].moment
      };
    } catch (err) {}
  });

  $scope.load = function() {
    api.getApplication($stateParams.owner, $stateParams.repo, $stateParams.ref).then(function(results) {
      $scope.application = results;
      $scope.application.ref = results.refs[$stateParams.ref];

      try {
        $scope.selected.deployment = results.ref.deployments[0];
      } catch (err) {}

      $scope.loaded = true;
    }, function(error) {
      $mdToast.show($mdToast.simple().position('top left').content('Error Getting Application!'));
      console.error(error);
    });
  };

  $scope.load();
}]);

})();
