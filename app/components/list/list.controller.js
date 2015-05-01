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

  .controller('ListCtrl', function ($scope, $filter, $cookies, client) {
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
            difference: $filter('amDifference')(data[i]._source.date, null, 'seconds') * -1,
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

    $scope.getData = function () {
      var query = {
            bool: {
              must: [
                {match: {type: 'NEW_JOB'}}
              ]
            }
          };

      for (var param in $scope.query) {
        if ($scope.query[param]) {
          var newQuery = {match: {}};
          newQuery.match['meta-info.git.' + param] = $scope.query[param];
          query.bool.must.push(newQuery);
        }
      }

      client.search({
        index: 'totem-production',
        type: 'events',
        size: $scope.pageSize,
        from: $scope.page * $scope.pageSize,
        body: {
          sort: [{date: {order: 'desc'}}],
          query: query
        }
      })
      .then(function (resp) {
        $scope.data = sanitizeData(resp.hits.hits);
        $scope.updatePages(resp.hits.total);
      });
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
  })
;
