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

.controller('ApplicationsSelectedContoller', ['$document', '$scope', '$stateParams', '$websocket', '$mdToast', '$mdDialog', '$window', '$location', '$timeout', 'api', 'logs', function($document, $scope, $stateParams, $websocket, $mdToast, $mdDialog, $window, $location, $timeout, api, logService) {
  $scope.application = null;
  $scope.events = [];
  $scope.ganttData = [];
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
    var machines = {},
        units = deployment.runtime.units,
        upstreams = deployment.runtime['proxy-upstreams'];

    if (!units) {
      return [];
    }

    _.each(units, function (unit) {
      if (unit.unit.indexOf('app') === -1) {
        return [];
      }

      var address = unit.machine.split('/')[1],
          id = unit.machine.split('/')[0];

      machines[address] = machines[address] || {
        id: id,
        address: address,
        units: [],
      };

      var clonedUnit = _.cloneDeep(unit);
      clonedUnit.upstreams = {};

      _.each(upstreams, function (upstream, port) {
        clonedUnit.upstreams[port] = _.findWhere(upstream, {'service-name': clonedUnit.unit});
      });

      machines[address].units.push(clonedUnit);
    });

    return _.valuesIn(machines);
  }

  function logScroll() {
    if ($scope.logs.scroll) {
      angular.element('html, body').animate({
         scrollTop: $(document).height() + angular.element('#log-messages').offset().top
      }, 'slow');
    }
  }

  function updateEvents (events, clusterName) {
    var data = $scope.ganttData;
    data.length = 0;

    var findCluster = {deployer: {cluster: clusterName}},
        newDeploymentEvent = _.findWhere(events, {type: 'NEW_DEPLOYMENT', metaInfo: findCluster}),
        nodesDiscoveredEvent = _.findWhere(events, {type: 'NODES_DISCOVERED', metaInfo: findCluster}),
        deploymentCheckEvent = _.findWhere(events, {type: 'DEPLOYMENT_CHECK_PASSED', metaInfo: findCluster}),
        wiredEvent = _.findWhere(events, {type: 'WIRED', metaInfo: findCluster}),
        promotedEvent = _.findWhere(events, {type: 'PROMOTED', metaInfo: findCluster}),
        newJobEvent = _.findWhere(events, {type: 'NEW_JOB'}),
        deployRequestedEvent = _.findWhere(events, {type: 'DEPLOY_REQUESTED'});

    var sortedEvents = {
      'Deploy Application': {
        start: newDeploymentEvent,
        end: nodesDiscoveredEvent
      },
      'Validate Application': {
        start: nodesDiscoveredEvent,
        end: deploymentCheckEvent
      },
      'Wire Application': {
        start: deploymentCheckEvent,
        end: wiredEvent
      },
      Cleanup: {
        start: wiredEvent,
        end: promotedEvent
      }
    };

    data.push({
      name: 'Build + CI',
      id: 'build-ci',
      classes: 'build-ci-row',
      tasks: [{
        name: moment.duration(deployRequestedEvent.moment.diff(newJobEvent.moment)).humanize(),
        classes: 'build-ci-task',
        from: newJobEvent.moment,
        to: deployRequestedEvent.moment
      }]
    });

    var parent = {
      name: 'Deployment',
      id: clusterName,
      classes: 'parent-row',
      tasks: []
    };

    _.each(sortedEvents, function (deploymentEvent, eventName) {
      if (deploymentEvent.end && !deploymentEvent.start) {
        deploymentEvent.start = deploymentEvent.end;
      }

      if (deploymentEvent.start && deploymentEvent.end) {
        var taskStart = deploymentEvent.start.moment,
            taskEnd = deploymentEvent.end.moment;

        parent.tasks.push({
          name: '',
          classes: 'overview-task',
          from: taskStart,
          to: taskEnd
        });

        data.push({
          parent: clusterName,
          name: eventName,
          id: clusterName + '.' + eventName,
          tasks: [{
            name: moment.duration(taskEnd.diff(taskStart)).humanize(),
            classes: eventName,
            from: taskStart,
            to: taskEnd
          }]
        });
      }
    });

    if (parent.tasks.length) {
      data.push(parent);
    }

    try {
      var startMoment = events[events.length - 1].moment,
          endMoment = events[0].moment,
          jobDuration = endMoment.diff(startMoment, 'minutes');

      $scope.ganttScale = Math.ceil(jobDuration / 12) + ' minutes';

      $scope.ganttTimespan = {
        from: startMoment,
        to: endMoment
      };
    } catch (err) {}
  }

  $scope.$watch('selected.deployment', function(deployment) {
    if (_.isUndefined(deployment) || _.isNull(deployment)) {
      return;
    }

    // TODO: Remove once node information is in the document.
    deployment.nodes = getNodes(deployment);

    api.getJobEvents(deployment.metaInfo.jobId).then(function(results) {
      updateEvents(results.events, deployment.metaInfo.deployer.name);
      $scope.events = results;
      $scope.loaded = true;
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

  $scope.cloneDeployment = function (deployment) {
    $scope.working = true;
    api.cloneDeployment(deployment.deployment.name, deployment.deployment.version, deployment.state, deployment.metaInfo.deployer.url).then(function () {
      $timeout(function () {
        $scope.load();
        $scope.working = false;
      }, 10000);
    });
  };

  function deleteDeployment (deployment) {
    $scope.working = true;
    api.deleteDeployment(deployment.deployment.name, deployment.metaInfo.deployer.url).then(function () {
      $scope.working = false;
      $scope.selected.deployment.decomissionStarted = true;
    });
  }

  $scope.deleteDialog = function (event, deployment) {
    var confirm = $mdDialog.confirm()
          .title('Confirm decommission')
          .content('Are you sure you want to decommission this deployment?')
          .ok('No') // Swapping here to make "no" the default
          .cancel('Yes')
          .targetEvent(event);

    $mdDialog.show(confirm).catch(function () {
      deleteDeployment(deployment);
    });
  };

  $scope.open = function (location) {
    $window.open('http://' + location.hostname + location.path);
  };

  $scope.load = function() {
    api.getApplication($stateParams.owner, $stateParams.repo, $stateParams.ref).then(function(results) {
      $scope.application = results;
      $scope.application.ref = results.refs[$stateParams.ref];

      try {
        $scope.selected.deployment = results.ref.deployments[0];
      } catch (err) {}
    }, function(error) {
      $mdToast.show($mdToast.simple().position('top left').content('Error Getting Application!'));
      console.error(error);
    });
  };

  $scope.load();
}]);

})();
