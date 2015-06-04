'use strict';

angular.module('totemDashboard')
  .controller('ListCtrl', function ($scope, $filter, $cookies, env, api) {
    var self = this;

    this.load = function () {
      $scope.data = [];
      $scope.pageSize = $cookies.pageSize || 25;
      $scope.page = 0;
      $scope.dropdownStatus = {isopen: false};
      $scope.query = {};

      $scope.$watchCollection(
        function () {
          return env.get();
        },
        function () {
          $scope.getData();
        }
      );
    };

    $scope.getData = function () {
      api.search({
        size: $scope.pageSize,
        from: $scope.page * $scope.pageSize,
        query: $scope.query
      }).then(function (resp) {
        $scope.data = resp.data;
        self.updatePages(resp.total);
      });
    };

    $scope.setPageSize = function (pageSize) {
      $scope.pageSize = $cookies.pageSize = pageSize;
      $scope.getData();
    };

    $scope.setPage = function (page) {
      // Next button
      if (page === 'next') {
        // Only increment within lmits
        if ($scope.page < $scope.lastPage) {
          $scope.setPage($scope.page + 1);
        }

        return;
      }

      // Previous button
      if (page === 'prev') {
        // Only increment down to 0
        if ($scope.page > 0) {
          $scope.setPage($scope.page - 1);
        }

        return;
      }

      if (typeof page === 'number' &&
          page >= 0 &&
          page <= $scope.lastPage) {
        $scope.page = page;
        $scope.getData();
      }
    };

    this.updatePages = function (total) {
      var totalPages = Math.ceil(total / $scope.pageSize),
          pagesArr = [];

      for (var i = 0; i < totalPages; i++) {
        pagesArr.push(i);

        // This artificially limits the user to 10 pages (max 1000 events)
        // should be improved in the future
        if (i >= 9) {
          break;
        }
      }

      $scope.pagesArr = pagesArr;

      $scope.lastPage = pagesArr[pagesArr.length - 1];

      if ($scope.page > $scope.lastPage) {
        $scope.setPage($scope.lastPage);
      }
    };

    // Kick it off
    this.load();
  })
;
