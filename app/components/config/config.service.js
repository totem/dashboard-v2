/* globals _ */
'use strict';

angular.module('totemDashboard')
  .service('configService', ['$http', '$q', 'dashboardConfigUrl', 'servicesConfigUrl', function ($http, $q, dashboardConfigUrl, servicesConfigUrl) {
    var self = this;
    this.settings = null;
    this.totemServices = null;

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
      return $http.get(dashboardConfigUrl).success(function (data) {
        self.settings = data;
      });
    };

    this.getServices = function () {
      var deferred = $q.defer();

      if (!this.totemServices) {
        this.getRawServices()
          .success(function (data) {
            deferred.resolve(data);
          })
          .error(function (data) {
            deferred.reject(data);
          })
        ;
      } else {
        deferred.resolve(this.totemServices);
      }

      return deferred.promise;
    };

    this.getRawServices = function () {
      return $http.get(servicesConfigUrl).success(function (data) {
        self.totemServices = data;
      });
    };
  }])

  .factory('config', ['configService', function (configService) {
    return configService.settings;
  }])

  .factory('totemServices', ['configService', function (configService) {
    var totemServices = {};

    _.each(configService.totemServices.links, function (link) {
      totemServices[link.rel] = _.cloneDeep(link);
    });

    return totemServices;
  }])
;
