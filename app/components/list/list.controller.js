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

  .controller('ListCtrl', function ($scope, $filter, $cookies, client, esFactory) {
    $scope.data = [];
    $scope.pageSize = $cookies.pageSize || 25;
    $scope.page = 0;
    $scope.dropdownStatus = {isopen: false};
    $scope.query = {};

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
          };

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

    $scope.getData = function () {
      var query = {
        bool: {
          should: [
            {match: {type: 'NEW_JOB'}}
          ]
        }
      };

      for (var param in $scope.query) {
        if ($scope.query[param]) {
          var newQuery = {match: {}};
          newQuery.match[param] = $scope.query[param];
          query.bool.should.push(newQuery);
        }
      }

      client.search({
        index: 'totem-production',
        type: 'events',
        size: $scope.pageSize,
        from: $scope.page * $scope.pageSize,
        body: {
          query: query
        }
      })
      .then(function (resp) {
        $scope.data = sanitizeData(resp.hits.hits);
        $scope.updatePages(resp.hits.total);
      });
    };

    $scope.difference = function (build) {
      return $filter('amDifference')(build.date, null) * -1;
    };

    $scope.setPageSize = function (pageSize) {
      $scope.pageSize = $cookies.pageSize = pageSize;
      $scope.getData();
    };

    $scope.setPage = function (page) {
      if (page === 'next' && $scope.page < 9) {
        $scope.setPage($scope.page + 1);
        return;
      }

      if (page === 'prev' && $scope.page > 0) {
        $scope.setPage($scope.page - 1);
      }

      $scope.page = page;
      $scope.getData();
    };

    $scope.toggleDropdown = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.status.isopen = !$scope.status.isopen;
    };

    $scope.updatePages = function (total) {
      var totalPages = Math.ceil(total / $scope.pageSize),
          pagesArr = [];

      for (var i = 0; i < totalPages; i++) {
        pagesArr.push(i);

        if (i >= 9) {
          break;
        }
      }

      $scope.pagesArr = pagesArr;

      var lastPage = pagesArr[pagesArr.length - 1];

      if ($scope.page > lastPage) {
        $scope.setPage(lastPage);
      }
    };

    $scope.getData();

    window.scope = $scope;
  })
;
