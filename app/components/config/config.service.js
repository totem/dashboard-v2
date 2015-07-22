'use strict';

angular.module('totemDashboard')
  .service('config', ['$http', '$q', 'totemConfigUrl', function ($http, $q, totemConfigUrl) {
    var self = this;
    this.environments = null;

    this.get = function () {
      var deferred = $q.defer();

      if (!this.environments) {
        this.getRaw()
          .success(function (data) {
            deferred.resolve(data.environments);
          })
          .error(function (data) {
            deferred.reject(data);
          })
        ;
      } else {
        deferred.resolve(this.environments);
      }

      return deferred.promise;
    };

    this.getRaw = function () {
      return $http.get(totemConfigUrl).success(function (data) {
        self.environments = data.environments;
      });
    };
  }])

  .service('env', ['config', function (config) {
    var env;

    this.get = function () {
      if (!env) {
        this.set('production');
      }

      return config.environments[env];
    };

    this.set = function (newEnv) {
      env = newEnv;
    };
  }])
;
