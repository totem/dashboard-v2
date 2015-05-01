'use strict';

angular.module('totemDashboard')
  .config(function ($stateProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'components/list/list.html',
        controller: 'ListCtrl'
      });
  })

  .controller('ListCtrl', function ($scope, $filter, client, esFactory) {
    $scope.data = [];

    function sanitizeData (data) {
      var cleanData = [];

      for (var i = 0; i < data.length; i++) {
        if (data[i]._source['meta-info']) {
          var cleanObj = {
            date: data[i]._source.date,
            owner: data[i]._source['meta-info'].git.owner,
            repo: data[i]._source['meta-info'].git.repo,
            ref: data[i]._source['meta-info'].git.ref,
            original: data[i]._source
          }

          cleanData.push(cleanObj);
        }
      }

      return cleanData;
    }

    client.cluster.state({
      metric: [
        'cluster_name',
        'nodes',
        'master_node',
        'version'
      ]
    })
    .then(function (resp) {
      $scope.clusterState = resp;
      $scope.error = null;
    })
    .catch(function (err) {
      $scope.clusterState = null;
      $scope.error = err;
      // if the err is a NoConnections error, then the client was not able to
      // connect to elasticsearch. In that case, create a more detailed error
      // message
      if (err instanceof esFactory.errors.NoConnections) {
        $scope.error = new Error('Unable to connect to elasticsearch. ' +
          'Make sure that it is running and listening at http://localhost:9200');
      }
    });

    client.search({
      index: 'totem-production',
      type: 'events',
      size: 100,
      body: {
        query: {
          match: {
            type: 'NEW_JOB'
          }
        }
      }
    })
    .then(function (resp) {
      $scope.data = sanitizeData(resp.hits.hits);
    });

    $scope.difference = function (build) {
      return $filter('amDifference')(build.date, null) * -1;
    }

    window.scope = $scope;
  })
;
