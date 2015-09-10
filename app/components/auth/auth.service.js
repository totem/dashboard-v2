/* global _ */

'use strict';

angular.module('totemDashboard')
.service('githubAuth', ['$q', '$window', function ($q, $window) {

  /**
   * Vars
   */
  var
    self = this,
    baseUrl = 'https://c8cab2fe.ngrok.io',
    authDeferred,
    authInProgress,
    authWindowIntervalId;

  /**
   * Private methods
   */

  this._beginAuth = function () {
    authInProgress = true;
    authDeferred = $q.defer();
  };

  this._rejectExistingAuth = function () {
    authInProgress = false;
    if (authDeferred && _.isFunction(authDeferred.reject)) {
      authDeferred.reject();
    }
  };

  this._resolveExistingAuth = function (data) {
    authInProgress = false;
    if (authDeferred && _.isFunction(authDeferred.resolve)) {
      authDeferred.resolve(data);
    }
  };

  /**
   * Methods
   */

  // Auth profile
  this.authorize = function () {
    self._rejectExistingAuth();
    self._beginAuth();

    var connectUrl = baseUrl + '/auth/github',
        authWindow = $window.open(connectUrl);

    // Watch for the auth window to close on it's own
    // This path is only for non-spec compliant browsers such as IE
    if (authWindowIntervalId) { $window.clearInterval(authWindowIntervalId); }
    authWindowIntervalId = $window.setInterval(function() {
      if (authWindow && authWindow.closed) {
        if (authWindowIntervalId) { $window.clearInterval(authWindowIntervalId); }
        // Refresh the list of profiles
        self._resolveExistingAuth();
      }
    }, 500);
    return authDeferred.promise;
  };


  /**
   * Watchers
   */

    // Handle notifications from the Identity service's OAuth workflow
  $window.addEventListener('message', function(e) {
    // If the message is from the identity service
    if (e.origin.indexOf(baseUrl) !== -1) {
      e.source.close();
      if (authWindowIntervalId) { $window.clearInterval(authWindowIntervalId); }
      try {
        // inter-window messages are strings for browser compatibility
        var message = JSON.parse(e.data);

        // Refresh the list of profiles
        self._resolveExistingAuth(message.token);
      } catch (err) {
        // do nothing
      }
    }
  });
}]);
