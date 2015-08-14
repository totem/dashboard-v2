'use strict';

angular.module('totemDashboard')
  .service('config', ['$http', '$q', 'totemConfigUrl', function ($http, $q, totemConfigUrl) {
    var self = this;
    this.settings = null;

    this.get = function () {
      var deferred = $q.defer();

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
        deferred.resolve(this.settings);
      }

      return deferred.promise;
    };

    this.getRaw = function () {
      return $http.get(totemConfigUrl).success(function (data) {
        self.settings = data;
      });
    };
  }])

  .service('env', ['config', function (config) {
    var env;

    this.get = function () {
      if (!env) {
        this.set('production');
      }

      return config.settings;
    };

    this.set = function (newEnv) {
      env = newEnv;
    };
  }])
;
