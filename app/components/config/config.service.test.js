'use strict';

describe('Controller: config', function() {

  beforeEach(module('totemDashboard'));

  var config,
      httpBackend;

  var environments = {
    production: {
      elasticsearch: {
        index: 'totem-production',
        url: 'elasticsearch.dev'
      }
    }
  };

  beforeEach(inject(function(_config_, $httpBackend) {
    config = _config_;
    httpBackend = $httpBackend;
  }));

  it('should get config data from the config url', inject(function(totemConfigUrl) {
    httpBackend.whenGET(totemConfigUrl).respond({
      environments: environments
    });

    config.get().then(function (data) {
      expect(data).toEqual(environments);
    });

    httpBackend.flush();
  }));
});
