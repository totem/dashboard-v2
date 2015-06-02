'use strict';

angular.module('totemDashboard')
  .filter('capitalize', function () {
    return function (string) {
      var arr = string.split('');
      arr[0] = arr[0].toUpperCase();
      return arr.join('');
    };
  })
;
