(function () {
'use strict';

/*jshint strict: true */
/*globals angular,moment */

angular.module('totemDashboard')
  .filter('ago', function() {
    return function(when) {
      if (when === undefined || when === null) {
        return '';
      }

      return moment(when).fromNow();
    };
  })
  .filter('humanizeTimeDiff', function() {
    return function(when) {
      if (when === undefined || when === null) {
        return '';
      }

      return moment.duration(moment().diff(when)).humanize();
    };
  })
;

})();
