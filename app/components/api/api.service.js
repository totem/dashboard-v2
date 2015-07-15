(function () {
'use strict';

/*jshint strict: true */
/*globals _,angular,moment*/

angular.module('totemDashboard')
  .service('client', function (env, esFactory) {
    var cache = {};

    this.get = function (logLevel) {
      logLevel = logLevel || 'info';

      var host = env.get().elasticsearch.url;

      if (cache[host]) {
        return cache[host];
      }

      return (cache[host] = esFactory({
        host: host,
        apiVersion: '1.5',
        log: logLevel
      }));
    };
  })

  .service('api', ['$q', 'client', 'env', function ($q, client, env) {
    function transformDeploymentHit(source) {
      // set datum to the cloned meta-info
      source.metaInfo = source['meta-info'];
      source.metaInfo.jobId = source.metaInfo['job-id'];

      source.startedAt = moment(source['started-at'], 'YYYY-MM-DDTHH:mm:ss');

      return source;
    }

    function transformProxyData(item) {
      // method to build a result item
      function resultItem(port, hostnames, profileName) {
        return {
          port: port,
          hostnames: hostnames,
          profileName: profileName,
          locations: {}
        };
      }

      // Make sure the item has a proxy block
      if (!('proxy' in item)) {
        return item;
      }

      var proxy = item.proxy;
      var result = {};

      // for each profile, and each location build out the results
      for (var profileName in proxy.hosts) {
        var profile = proxy.hosts[profileName];
        var hostnames = profile.hostname.split(',');

        for (var locationName in profile.locations) {
          var location = profile.locations[locationName];

          // test and set
          result[location.port] = result[location.port] || resultItem(location.port, hostnames, profileName);
          result[location.port].locations[locationName] = location;
          location.name = locationName;
        }
      }

      // Check each upstream for ones that aren't proxied
      for (var key in proxy.upstreams) {
        // Check if the upstream is configured
        if (!(key in result)) {
          result[key] = resultItem(key, [], null);
        }
      }

      item.proxyMeta = result;

      return item;
    }

    function getApplicationParent(item, results) {
      var applicationId = item.metaInfo.git.owner + '-' + item.metaInfo.git.repo;
      if (!(applicationId in results)) {
        results[applicationId] = {
          id: applicationId,
          owner: item.metaInfo.git.owner,
          repo: item.metaInfo.git.repo,
          refs: {}
        };
      }

      if (!(item.metaInfo.git.ref in results[applicationId].refs)) {
        results[applicationId].refs[item.metaInfo.git.ref] = {
          ref: item.metaInfo.git.ref,
          state: null,
          deployments: []
        };
      }

      return results[applicationId];
    }

    /**
      Check under the refs key for decommissioned refs and remove them.
      Can be used in a chain from accessing the deployment documents.
    **/
    function pruneRefs(results) {
      for (var ref in results.refs) {
        if (results.refs[ref].deployments[0].state === 'DECOMMISSIONED') {
          delete results.refs[ref];
        }
      }
    }

    this.listApplications = function() {
      /**
        Get a list of all applications. Group them by owner and repo

        Response Model
        {
          applications: {
            'owner-repo': {
              ...
            }
          }
        }
      **/
      var esClient = client.get();

      var deferred = deferred || $q.defer(),
          promise = deferred.promise;

      var hits = [];

      var body = {
        query: {
          'match_all': {}
        },
        filter: {
          bool: {
            'must_not': [{
              term: {
                state: ['DECOMMISSIONED']
              }
            }]
          }
        }
      };

      esClient.search({
        index: env.get().elasticsearch.index,
        type: 'deployments',
        scroll: '30s',
        size: 1000,
        body: body
      }, function getMoreUntilDone(error, response) {
        if (error) {
          deferred.reject(error);
        }

        _.each(response.hits.hits, function(hit) {
          hits.push(hit._source);
        });

        if (response.hits.total !== hits.length) {
          esClient.scroll({
            scrollId: response._scroll_id,
            scroll: '30s'
          }, getMoreUntilDone);
        } else {
          // All results are in the hits array.
          var deployments = _.chain(hits)
            .map(transformDeploymentHit)
            .map(transformProxyData)
            .sortBy('startedAt')
            .reverse()
            .reduce(function(results, item) {
              var parent = getApplicationParent(item, results);
              var ref = item.metaInfo.git.ref;

              parent.refs[ref].deployments.push(item);

              if (!parent.refs[ref].state) {
                parent.refs[ref].state = item.state;
              }

              return results;
            }, {})
            .tap(pruneRefs)
            .value();

          deferred.resolve({
            deployments: deployments
          });
        }
      });

      return promise;
    };

    this.getApplication = function(owner, repo) {
      /**
        Get an application by owner, repo. Fetches all refs.

        Response Model
        {
          ...
        }
      **/
      var esClient = client.get();

      var deferred = deferred || $q.defer(),
          promise = deferred.promise;

      var hits = [];

      var body = {
        query: {
          'match_all': {}
        },
        filter: {
          bool: {
            must: [{
              term: {
                owner: owner
              }
            }, {
              term: {
                repo: repo
              }
            }]
          }
        }
      };

      esClient.search({
        index: env.get().elasticsearch.index,
        type: 'deployments',
        scroll: '30s',
        size: 1000,
        body: body
      }, function getMoreUntilDone(error, response) {
        if (error) {
          deferred.reject(error);
        }

        _.each(response.hits.hits, function(hit) {
          hits.push(hit._source);
        });

        if (response.hits.total !== hits.length) {
          esClient.scroll({
            scrollId: response._scroll_id,
            scroll: '30s'
          }, getMoreUntilDone);
        } else {
          // All results are in the hits array.
          var deployments = _.chain(hits)
            .map(transformDeploymentHit)
            .map(transformProxyData)
            .sortBy('startedAt')
            .reverse()
            .reduce(function(results, item) {
              // Check if we should set the top level stuff
              if (_.isUndefined(results.owner)) {
                results.owner = owner;
                results.repo = repo;
                results.refs = {};
              }
              var ref = item.metaInfo.git.ref;

              if (!(ref in results.refs)) {
                results.refs[ref] = {
                  name: ref,
                  state: item.state,
                  deployments: []
                };
              }

              results.refs[ref].deployments.push(item);

              return results;
            }, {})
            .tap(pruneRefs)
            .value();

          deferred.resolve(deployments);
        }
      });

      return promise;
    };

    this.getJobEvents = function(jobId) {
      /**
        Get all events for a jobId.

        Response Model
        {
          ...
        }
      **/
      var esClient = client.get();

      var deferred = deferred || $q.defer(),
          promise = deferred.promise;

      var hits = [];

      var body = {
        query: {
          'match_all': {}
        },
        filter: {
          bool: {
            must: [{
              term: {
                'meta-info.job-id': jobId
              }
            }]
          }
        }
      };

      esClient.search({
        index: env.get().elasticsearch.index,
        type: 'events',
        scroll: '30s',
        size: 1000,
        body: body
      }, function getMoreUntilDone(error, response) {
        if (error) {
          deferred.reject(error);
        }

        _.each(response.hits.hits, function(hit) {
          hits.push(hit._source);
        });

        if (response.hits.total !== hits.length) {
          esClient.scroll({
            scrollId: response._scroll_id,
            scroll: '30s'
          }, getMoreUntilDone);
        } else {
          // All results are in the hits array.
          var events = _.chain(hits)
            .map(transformDeploymentHit)
            .sortBy('startedAt')
            .reverse()
            .value();

          deferred.resolve({
            jobId: jobId,
            events: events,
            hits: hits
          });
        }
      });

      return promise;
    };
  }])
;

})();