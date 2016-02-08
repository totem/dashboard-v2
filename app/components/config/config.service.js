(function () {
'use strict';

angular.module('totemDashboard')
  .service('configService', ['$window', '$log', '$http', '$q', 'totemConfigUrl', function ($window, $log, $http, $q, totemConfigUrl) {
    var self = this;

    this.get = function () {
      var deferred = $q.defer();

      if (!totemConfigUrl) {
        $log.error('No configuration URL set, see config.service for details.', totemConfigUrl);
        deferred.reject('No configuration URL set. Please let someone know, or look in the console logs.');

        return deferred.promise;
      }

      try {
        this.settings = angular.fromJson($window.sessionStorage.getItem('totem.dashboard.config'));
      } catch(err) {
      }

      if (!this.settings) {
        this.getRaw()
          .success(function (data) {
            deferred.resolve(data);
          })
          .error(function (data) {
            deferred.reject(data);
          })
        ;
      } else {
        // Still load the config from remote to support updating it without slowing down the current session.
        this.getRaw();
        // Resolve the loaded settings
        deferred.resolve(this.settings);
      }

      return deferred.promise;
    };

    this.getRaw = function () {
      return $http.get(totemConfigUrl).success(function (data) {
        // Also save the config to session storage
        $window.sessionStorage.setItem('totem.dashboard.config', angular.toJson(data));
        self.settings = data;
      });
    };
  }])

  .factory('config', ['configService', function (configService) {
    return configService.settings;
  }])
;
})();
