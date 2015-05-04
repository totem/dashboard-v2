'use strict';

describe('controllers', function(){
  var scope;

  beforeEach(module('totemDashboard'));

  beforeEach(inject(function($rootScope) {
    scope = $rootScope.$new();
  }));

  it('', inject(function($controller) {
    $controller('ListCtrl', {
      $scope: scope
    });
  }));
});
