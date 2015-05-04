'use strict';

angular.module('totemDashboard')
  .controller('ListCtrl', function ($scope, $filter, $cookies, api) {
    var self = this;

    this.load = function () {
      $scope.data = [];
      $scope.pageSize = $cookies.pageSize || 25;
      $scope.page = 0;
      $scope.dropdownStatus = {isopen: false};
      $scope.query = {};

      $scope.getData();
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

    this.updatePages = function (total) {
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

    this.load();
  })
;
