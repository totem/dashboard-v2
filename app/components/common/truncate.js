(function () {
'use strict';

/*jshint strict: true */
/*globals angular*/

angular.module('totemDashboard')
  .filter('truncate', function() {
    return function(str, n) {
      if (str === undefined || str === null) {
        return '';
      }

      if (n === undefined) {
        n = 10;
      }

      return str.length > n ? str.substr(0, n) : str;
    };
  });

})();
