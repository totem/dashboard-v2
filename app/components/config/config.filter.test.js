'use strict';

describe('Filter: capitalize', function() {
  var $filter;

  beforeEach(module('totemDashboard'));

  beforeEach(inject(function(_$filter_) {
    $filter = _$filter_;
  }));

  it('should capitalize the first character of a string', inject(function () {
    expect($filter('capitalize')('hello'), 'Hello');
    expect($filter('capitalize')('hello world'), 'Hello world');
    expect($filter('capitalize')('Hello world'), 'Hello world');
    expect($filter('capitalize')('123 hello'), '123 hello');
  }));
});
