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

  .controller('ListCtrl', function ($scope, $filter, ngTableParams) {
    var data = [{name: "Moroni", value: 50},
                {name: "Tiancum", value: 43},
                {name: "Jacob", value: 27},
                {name: "Nephi", value: 29},
                {name: "Enos", value: 34},
                {name: "Tiancum", value: 43},
                {name: "Jacob", value: 27},
                {name: "Nephi", value: 29},
                {name: "Enos", value: 34},
                {name: "Tiancum", value: 43},
                {name: "Jacob", value: 27},
                {name: "Nephi", value: 29},
                {name: "Enos", value: 34},
                {name: "Tiancum", value: 43},
                {name: "Jacob", value: 27},
                {name: "Nephi", value: 29},
                {name: "Enos", value: 34}];

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
    })
  })
;
