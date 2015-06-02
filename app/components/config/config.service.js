'use strict';

angular.module('totemDashboard')
  .service('config', function ($http, $q, totemConfigUrl) {
    var cache;

    this.get = function () {
      var deferred = $q.defer();

      if (!cache) {
        this.getRaw()
        .success(function (data) {
          cache = data;
          deferred.resolve(data);
        })
        .error(function (data) {
          deferred.reject(data);
        });
      } else {
        deferred.resolve(cache);
      }

      return deferred.promise;
    };

    this.getRaw = function () {
      return $http.get(totemConfigUrl);
    };
  })

  .service('env', function (config, $q) {
    var env;

    this.get = function () {
      if (!env) this.set('production');

      var deferred = $q.defer();

      config.get()
      .then(function (data) {
        deferred.resolve(data.environments[env]);
      })
      .catch(function (data) {
        deferred.reject(data);
      });

      return deferred.promise;
    };

    this.set = function (newEnv) {
      env = newEnv;
    };
  })
;
