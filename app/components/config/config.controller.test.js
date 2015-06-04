'use strict';

describe('Controller: ConfigCtrl', function() {

  beforeEach(module('totemDashboard'));

  var ConfigCtrl,
      scope,
      q,
      configDeferred;

  var mockConfig = {
    get: function () {
      configDeferred = q.defer();
      return configDeferred.promise;
    }
  };

  var responseData = {
    production: {
      elasticsearch: {
        index: 'totem-production',
        url: 'elasticsearch.dev'
      }
    }
  };

  beforeEach(inject(function($controller, $rootScope, $q) {
    scope = $rootScope.$new();
    q = $q;

    ConfigCtrl = $controller('ConfigCtrl', {
      $scope: scope,
      config: mockConfig
    });
  }));

  it('should get config data from the config service', inject(function() {
    configDeferred.resolve(responseData);
    scope.$apply();
    expect(scope.environments).toEqual(Object.keys(responseData));
  }));

  it('should set the current env', inject(function () {
    configDeferred.resolve(responseData);
    scope.$apply();
    expect(scope.currentEnv).toEqual('production');
  }));
});
