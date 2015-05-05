'use strict';

describe('Controller: ListCtrl', function() {

  beforeEach(module('totemDashboard'));

  var ListCtrl,
      scope,
      q,
      listDeferred;

  var mockApi = {
    search: function () {
      listDeferred = q.defer();
      return listDeferred.promise;
    }
  };

  var responseData = {
    data: [{
      date: '2015-05-05T07:01:31.389760',
      owner: 'meltmedia',
      ref: 'feature_reduce-size',
      repo: 'talu-facebook-data'
    }],
    total: 1
  };

  beforeEach(inject(function($controller, $rootScope, $q) {
    scope = $rootScope.$new();
    q = $q;

    ListCtrl = $controller('ListCtrl', {
      $scope: scope,
      api: mockApi
    });

    scope.lastPage = 10;
  }));

  it('should get data from the api', inject(function() {
    listDeferred.resolve(responseData);
    scope.$apply();
    expect(scope.data.length).not.toBe(0);
    expect(scope.data).toEqual(responseData.data);
  }));

  it('should store the page size in a cookie', inject(function($cookies) {
    scope.setPageSize(1);
    expect(scope.pageSize).toBe(1);
    expect($cookies.pageSize).toBe(1);
  }));

  it('should increment page number when \'next\' is called', inject(function () {
    scope.page = 5;
    scope.setPage('next');
    expect(scope.page).toBe(6);
  }));

  it('should not increment page number outside the limits of the pages', inject(function () {
    scope.page = 10;
    scope.setPage('next');
    expect(scope.page).toBe(10);
  }));

  it('should decrement page number when \'prev\' is called', inject(function () {
    scope.page = 5;
    scope.setPage('prev');
    expect(scope.page).toBe(4);
  }));

  it('should not decrement page number below 0', inject(function () {
    scope.page = 0;
    scope.setPage('prev');
    expect(scope.page).toBe(0);
  }));

  it('should store the page number on the $scope', inject(function () {
    scope.setPage(3);
    expect(scope.page).toBe(3);
  }));

  it('should store an array of page indices on the $scope', inject(function () {
    scope.pageSize = 10;
    ListCtrl.updatePages(30);
    expect(scope.pagesArr).toEqual([0,1,2]);
  }));

  it('should send you to the last available page when you are out of the bounds of the new page set', inject(function () {
    scope.page = 10;
    scope.pageSize = 5;
    ListCtrl.updatePages(15);
    expect(scope.page).toBe(2);
  }));
});
