(function () {
'use strict';

/*jshint strict: true */
/*globals _,angular,moment,$,document*/

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
  $stateProvider
    .state('app.applicationsSelected.summary', {
      url: '/summary',
      views: {
        'page': {
          controller: 'ApplicationsSelectedSummaryContoller',
          templateUrl: 'components/applications/selected/applications-selected-summary.html'
        }
      }
    });
  $stateProvider
    .state('app.applicationsSelected.logs', {
      url: '/logs',
      views: {
        'page': {
          controller: 'ApplicationsSelectedLogsContoller',
          templateUrl: 'components/applications/selected/applications-selected-logs.html'
        }
      }
    });
  $stateProvider
    .state('app.applicationsSelected.diagnostic', {
      url: '/diagnostic',
      views: {
        'page': {
          controller: 'ApplicationsSelectedDiagnosticContoller',
          templateUrl: 'components/applications/selected/applications-selected-diagnostic.html'
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

.controller('ApplicationsSelectedContoller', ['$log', '$scope', '$state', '$stateParams', '$mdToast', '$mdDialog', '$mdSidenav', '$timeout', '$interval', 'api', function($log, $scope, $state, $stateParams, $mdToast, $mdDialog, $mdSidenav, $timeout, $interval, api) {

  // Used to control the loading/working overlay]
  $scope.loaded = false;
  $scope.working = false;

  $scope.fabIsOpen = false;

  $scope.application = null;

  $scope.ganttOptions = {
    from: null,
    to: null,
    scale: null
  };

  $scope.events = null;

  // Used for the ref selection menu
  $scope.refs = [];
  $scope.selected = {
    tab: 0,
    deployment: null
  };

  $scope.diagnostic = {
    events: []
  };

  $scope.autoReload = true;
  $scope.updateInterval = null;

  $scope.friendlyState = {
    'PROMOTED': 'up for',
    'DECOMMISSIONED': 'deleted',
    'FAILED': 'failed',
    'STARTED': 'started',
    'NEW': 'created'
  };

  $scope.$watch('selected.deployment', function(deployment) {
    // Make sure to cancel the timer if the deployment changes
    $scope.toggleAutoReload(false);
    if (_.isUndefined(deployment) || _.isNull(deployment)) {
      return;
    }

    // If the deployment is still happening refresh automatically.
    if (deployment.state === 'NEW' || deployment.state === 'STARTED') {
      $scope.toggleAutoReload(true);
    }
  });

  $scope.toggleAutoReload = function(value) {
    // Try and cancel
    if ($scope.updateInterval) {
      $interval.cancel($scope.updateInterval);
    }

    // What ya get from the button click
    if (_.isUndefined(value)) {
      $scope.autoReload = !$scope.autoReload;
    }
    else {
      // Used during changing of a deployment
      $scope.autoReload = value;
    }

    if ($scope.autoReload) {
      $scope.updateInterval = $interval(function () {
        $scope.refresh();
      }, 30 * 1000);
    }
  };

  function getNodes(deployment) {
    if (!deployment.runtime.units) {
      return [];
    }

    return _.chain(deployment.runtime.units)
      .reduce(function(acc, unit) {
        // Only add the application units
        if (unit.unit.indexOf('app') < 0) {
          return acc;
        }

        var address = unit.machine.split('/')[1],
            id = unit.machine.split('/')[0];

        acc[address] = acc[address] || {
          id: id,
          address: address,
          units: []
        };

        var data = angular.merge({upstreams: {}}, unit);

        _.each(deployment.runtime['proxy-upstreams'], function(upstream, port) {
          data.upstreams[port] = _.findWhere(upstream, {'service-name': data.unit});
        });

        acc[address].units.push(data);

        return acc;
      }, {})
      .map()
      .value();
  }

  function _eventsRaw(events) {
    // Convert totem events into a basic set of row and task combinations
    function getType(eve) {
      return eve.type.toLowerCase().split('_').join(' ');
    }

    // Count each event type to support proper numbering
    var typeCounts = _.reduce(events, function(acc, eve) {
      var type = getType(eve);
      acc[type] = acc[type] || {
        count: 0,
        on: 0
      };

      acc[type].count++;

      return acc;
    }, {});

    return _.chain(events)
      .reduce(function(rows, eve, index) {
        // make sure the component has a row
        rows[eve.component] = rows[eve.component] || {
          name: eve.component,
          children: [],
          tasks: [{
            name: '',
            classes: 'overview-task',
            from: eve.moment
          }]
        };

        // set the end time for this component to the end of the last task
        rows[eve.component].tasks[0].to = eve.moment;

        var type = getType(eve);

        if (typeCounts[type].count > 1) {
          type = [type, ++typeCounts[type].on].join(' ');
        }

        rows[eve.component].children.push(type);

        rows[type] = {
          name: type,
          tasks: [{
            name: '',          
            classes: 'totem-event',
            from: eve.moment
          }]
        };

        if (index < events.length - 1) {
          rows[type].tasks[0].to = events[index + 1].moment;
        }

        return rows;
      }, {})
      .map()
      .value();
  }

  function _eventsByPhase(events) {
    /*
    Group the events into meaningful phases.

    Build: _START_ till DEPLOY_REQUESTED
    Deployment:
      Prep: NEW_DEPLOYMENT till UPSTREAMS_REGISTERED
      Pull: "UNITS_ADDED" till "NODES_DISCOVERED"
      Deploy: "UNITS_DEPLOYED" till "WIRED"
    Cleanup: "WIRED" till "PROMOTED"
    */
    function gen(name, classes, opts) {
      if (_.isUndefined(classes) || _.isNull(classes)) {
        classes = 'totem-event';
      }

      if (_.isUndefined(opts) || _.isNull(opts)) {
        opts = {};
      }

      return angular.merge({}, {
        name: name,
        tasks: [{
          name: null,
          classes: classes,
          from: null,
          to: null
        }]
      }, opts);
    }

    // Can be moved to configuration and generated.
    var phases = [
      gen('Build'), // 0
      gen('Deployment', 'overview-task', {children: ['Prep', 'Pull', 'Run']}),
      gen('Prep'), // 2
      gen('Pull'), // 3
      gen('Run'), // 4
      gen('Cleanup') // 5
    ];

    // Can be moved to configuration and generated.
    var endPhases = {
      start: function() { return phases[0].tasks[0]; },
      parent: function() { return null; },
      'DEPLOY_REQUESTED': {
        next: function() { return phases[2].tasks[0]; },
        parent: function() { return phases[1].tasks[0]; }
      },
      'UPSTREAMS_REGISTERED': {
        next: function() { return phases[3].tasks[0]; },
        parent: function() { return phases[1].tasks[0]; }
      },
      'NODES_DISCOVERED': {
        next: function() { return phases[4].tasks[0]; },
        parent: function() { return phases[1].tasks[0]; }
      },
      'WIRED': {
        next: function() { return phases[5].tasks[0]; },
        parent: function() { return null; }
      },
      'PROMOTED': {
        next: function() { return null; },
        parent: function() { return null; }
      }
    };

    var currentPhase = endPhases.start();
    var currentParent = endPhases.parent();

    _.each(events, function(eve) {
      if (currentPhase) {
        // accounts for the start of the cycle
        if (!currentPhase.to) {
          currentPhase.to = eve.moment;
        }

        currentPhase.from = eve.moment;

        if (currentParent) {
          currentParent.from = eve.moment;
        }
      }

      // If we're on an end event, set the new phase and parent
      if (_.has(endPhases, eve.type)) {
        currentPhase = endPhases[eve.type].next();
        currentParent = endPhases[eve.type].parent();

        // TODO: This shouldn't need to be done here, should be caught above.
        if (currentPhase) {
          currentPhase.to = eve.moment;
        }

        if (currentParent && !currentParent.to) {
          currentParent.to = eve.moment;
        }
      }
    });

    // for each task in each phase, set the name to the duration if the name isn't set.
    _.each(phases, function(phase) {
      _.each(phase.tasks, function(task) {
        if (task.name !== null) {
          return;
        }

        if (task.from && task.to) {
          task.name = moment.duration(task.from.diff(task.to)).humanize();
        }
      });
    });

    return phases;
  }

  function processEvents(deployment, events, raw) {
    // Size the gantt for the short time frame
    $scope.ganttOptions.from = _.first(events).moment;
    $scope.ganttOptions.to = _.last(events).moment;
    $scope.ganttOptions.scale = Math.ceil($scope.ganttOptions.to.diff($scope.ganttOptions.from, 'minutes') / 12) + ' minutes';

    if (raw === true) {
      $scope.events = _eventsRaw(events);
    } else {
      $scope.events = _eventsByPhase(events);      
    }
  }

  function processDeployment(deployment) {
    // start getting the events for the deployment
    api.getJobEvents(deployment.metaInfo.jobId).then(function(results) {
      $scope.diagnostic.events = results.events;
      processEvents(deployment, results.events);
    });

    deployment.nodes = getNodes(deployment);

    // add each location for each proxy
    deployment._locations = _.reduce(deployment.proxyMeta, function(acc, proxy) {
      _.each(proxy.locations, function(loc) {
        acc.push({
          hostname: loc.hostname,
          path: loc.path,
          port: loc.port,
          acls: loc['allowed-acls'].join(', '),
          isPublic: (loc['allowed-acls'].indexOf('public') >= 0),
          url: 'http://' + loc.hostname + loc.path
        });
      });

      return acc;
    }, []);

    $scope.selected.deployment = deployment;
  }

  $scope.isRestoreDisabled = function(deployment) {
    if (!deployment || !deployment.state) {
      return true;
    }

    if (deployment.state === 'DECOMMISSIONED' || deployment.state === 'FAILED') {
      return false;
    }

    return true;
  };

  $scope.restoreDeployment = function (deployment) {
    $scope.working = true;
    api.restoreDeployment(deployment.deployment.name, deployment.deployment.version, deployment.state, deployment.metaInfo.deployer.url).then(function () {
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

  $scope.toggleSidenav = function () {
    $mdSidenav('left').toggle();
  };

  $scope.getCommitLink = function (deployment) {
    try {
      var gitInfo = deployment.metaInfo.git;

      if (gitInfo.type === 'github') {
        return 'https://github.com/' + gitInfo.owner + '/' + gitInfo.repo + '/commit/' + gitInfo.commit;
      }
    } catch (err) {}
  };

 $scope.changeRef = function(newRef) {
    if (newRef === undefined || newRef === null) {
      return;
    }

    if (newRef !== $stateParams.ref) {
      // Stay in the same state, but change the ref
      $state.go($state.current.name, {
        owner: $stateParams.owner,
        repo: $stateParams.repo,
        ref: newRef
      });
    }
  };

  $scope.refresh = function () {
    $scope.load($scope.selected.deployment);
  };

  $scope.load = function (deployment) {
    if ($state.current.name === 'app.applicationsSelected') {
      $state.go('app.applicationsSelected.summary');
    }

    api.getApplication($stateParams.owner, $stateParams.repo, $stateParams.ref).then(function(results) {
      $scope.application = results;
      $scope.application.ref = results.refs[$stateParams.ref];

      $scope.refs = _.map(results.refs, function(ref) {
        return ref.name;
      });

      try {
        if (deployment) {
          processDeployment(_.findWhere(results.ref.deployments, {id: deployment.id}));
        } else {
          processDeployment(results.ref.deployments[0]);
        }
      } catch (err) {
        $log.error('unable to select a deployment', err);
      }
      $scope.loaded = true;
    }, function(error) {
      $mdToast.show($mdToast.simple().position('top left').content('Error Getting Application!'));
      $log.error(error);
    });
  };

  $scope.load();
}])

.controller('ApplicationsSelectedSummaryContoller', ['$scope', function($scope) {
  $scope.selected.tab = 0;
}])

.controller('ApplicationsSelectedLogsContoller', ['$scope', '$stateParams', 'logs', function($scope, $stateParams, logService) {
  $scope.selected.tab = 1;

  $scope.logs = {
    date: '',
    interval: 5,
    program: '',
    running: false,
    status: null,
    messages: [],
    scroll: true,
    showTimestamp: false,
    filter: {}
  };

  function logScroll() {
    if ($scope.logs.scroll) {
      angular.element('html, body').animate({
         scrollTop: $(document).height() + angular.element('#log-messages').offset().top
      }, 'slow');
    }
  }

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

}])

.controller('ApplicationsSelectedDiagnosticContoller', ['$scope', function($scope) {
  $scope.selected.tab = 2;
}]);

})();
