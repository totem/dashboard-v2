'use strict';

angular.module('totemDashboard')
  .controller('ConfigCtrl', function ($scope, $rootScope, config) {
    var self = this;

    this.load = function () {
      $scope.dropdownStatus = {isopen: false};
      this.getConfig();
    };

    this.getConfig = function () {
      config.get().then(function (res) {
        self.environments = res.environments;
        $scope.environments = Object.keys(res.environments);
        $scope.setEnv('development');
      });
    };

    $scope.setEnv = function (env) {
      $rootScope.env = self.environments[env];
    };

    this.load();
  })
;
