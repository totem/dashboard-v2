'use strict';

angular.module('totemDashboard')
  .service('client', function (esFactory, elasticSearchHost) {
    return esFactory({
      host: elasticSearchHost,
      apiVersion: '1.5',
      log: 'trace'
    });
  })
;
