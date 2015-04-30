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

  .controller('ListCtrl', function ($scope, $filter, ngTableParams, client, esFactory) {
    var data = [{name: 'Moroni', value: 50},
                {name: 'Tiancum', value: 43},
                {name: 'Jacob', value: 27},
                {name: 'Nephi', value: 29},
                {name: 'Enos', value: 34},
                {name: 'Tiancum', value: 43},
                {name: 'Jacob', value: 27},
                {name: 'Nephi', value: 29},
                {name: 'Enos', value: 34},
                {name: 'Tiancum', value: 43},
                {name: 'Jacob', value: 27},
                {name: 'Nephi', value: 29},
                {name: 'Enos', value: 34},
                {name: 'Tiancum', value: 43},
                {name: 'Jacob', value: 27},
                {name: 'Nephi', value: 29},
                {name: 'Enos', value: 34}];

    $scope.tableParams = new ngTableParams({
      page: 1,
      count: 10,
      sorting: {
        name: 'asc'
      }
    }, {
      total: data.length,
      getData: function ($defer, params) {
        // filtering
        var orderedData = params.filter() ? $filter('filter')(data, params.filter()) : data;

        // sorting
        orderedData = params.sorting() ? $filter('orderBy')(orderedData, params.orderBy()) : orderedData;

        params.total(orderedData.length);

        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      }
    });

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
      index: 'totem-production'
    })
    .then(function (resp) {
      $scope.totem = resp;
    });

    window.scope = $scope;
  })
;
