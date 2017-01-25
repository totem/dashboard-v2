'use strict';

describe('Controller: config', function() {

  beforeEach(module('totemDashboard'));

  var configService,
      httpBackend;

  var settings = {
    elasticsearch: {
      index: 'totem-production',
      url: 'elasticsearch.dev'
    },
    logs: {
      url: 'wss://totem-production.dev/logs'
    }
  };

  beforeEach(inject(function(_configService_, $httpBackend) {
    configService = _configService_;
    httpBackend = $httpBackend;
  }));

  it('should get config data from the config url', inject(function(totemConfigUrl) {
    httpBackend.whenGET(totemConfigUrl).respond(settings);

    configService.get().then(function (data) {
      expect(data).toEqual(settings);
    });

    httpBackend.flush();
  }));
});
