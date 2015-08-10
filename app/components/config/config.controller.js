'use strict';

angular.module('totemDashboard')
  .controller('ConfigCtrl', function ($scope, config, env) {
    this.load = function () {
      $scope.dropdownStatus = {isopen: false};
      this.getConfig();
    };

    this.getConfig = function () {
      config.get().then(function (res) {
        $scope.environments = Object.keys(res);
        $scope.setEnv('production');
      });
    };

    $scope.setEnv = function (newEnv) {
      env.set(newEnv);
      $scope.currentEnv = newEnv;
    };

    this.load();
  })
;
