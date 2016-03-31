(function () {
'use strict';

/*jshint strict: true, camelcase: false */
/*globals _,angular,moment*/

angular.module('totemDashboard')
  .service('client', ['config', 'esFactory', function (config, esFactory) {
    var cache = {};

    this.get = function (logLevel) {
      logLevel = logLevel || 'info';

      var host = config.elasticsearch.url;

      if (cache[host]) {
        return cache[host];
      }

      return (cache[host] = esFactory({
        host: host,
        apiVersion: '1.5',
        log: logLevel
      }));
    };
  }])

  .service('api', ['$q', '$http', 'client', 'config', function ($q, $http, client, config) {
    function transformDeploymentHit(source) {
      // set datum to the cloned meta-info
      source.metaInfo = source['meta-info'];
      source.metaInfo.jobId = source.metaInfo['job-id'];

      var format = 'YYYY-MM-DDTHH:mm:ss.SSSSSSZ';

      if (source['started-at']) {
        source.startedAt = moment(source['started-at'], format);
      }

      if (source['state-updated']) {
        source.stateUpdated = moment(source['state-updated'], format);
      }

      source.moment = moment(source.date, format);

      return source;
    }

    function transformProxyData(item) {
      // method to build a result item
      function resultItem(hostnames, profileName) {
        return {
          hostnames: hostnames,
          profileName: profileName,
          locations: []
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
        var hostnames = _.compact(profile.hostname.split(','));

        for (var locationName in profile.locations) {
          var location = profile.locations[locationName];
          location.name = locationName;

          // test and set
          result[profileName] = result[profileName] || resultItem(hostnames, profileName);

          if (profile.enabled && location.enabled) {
            for (var i = 0; i < hostnames.length; i++) {
              var locationWithHost = _.cloneDeep(location);
              locationWithHost.hostname = hostnames[i];
              result[profileName].locations.push(locationWithHost);
            }
          }

        }
      }

      item.proxyMeta = result;

      return item;
    }

    this.listApplications = function(options) {
      options = options || {
        refs: null
      };

      var filteredRefs = options.refs || ['develop', 'master'];

      if (!_.isArray(filteredRefs) && _.isString(filteredRefs)) {
        filteredRefs = filteredRefs.split(',');
      }

      var es = client.get();

      var deferred = deferred || $q.defer(),
          promise = deferred.promise;

      var body = {
        size: 1,
        aggregations: {
          owner: {
            terms: {
              field: 'meta-info.git.owner',
              size: 0
            },
            aggregations: {
              repo: {
                terms: {
                  field: 'meta-info.git.repo',
                  size: 0
                },
                aggregations: {
                  ref: {
                    terms: {
                      field: 'meta-info.git.ref',
                      size: 0
                    }
                  }
                }
              }
            }
          }
        }
      };

      es.search({
        index: config.elasticsearch.index,
        type: 'deployments',
        body: body
      }).then(function(response) {
        /*
          Returns an Array of
          {
            id: 'owner-repo',
            owner: 'owner',
            repo: 'repo',
            refs: {
              'ref': 'ref'
            }
          }
        */
        var applications = _.reduce(response.aggregations.owner.buckets, function(apps, owner) {
          _.each(owner.repo.buckets, function(repo) {
            // Build an "app" that's composed of the owner, repo, and branches.
            apps.push({
              id: [owner.key, repo.key].join('-'),
              owner: owner.key,
              repo: repo.key,
              refs: _.reduce(repo.ref.buckets, function(acc, ref) {
                acc[ref.key] = {
                  ref: ref.key,
                  count: ref.doc_count
                };

                return acc;
              }, {})
            });
          });

          return apps;
        }, []);

        deferred.resolve(applications);
      }, function(err) {
        deferred.reject(err);
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
          filtered: {
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
          }
        }
      };

      esClient.search({
        index: config.elasticsearch.index,
        type: 'deployments',
        scroll: '30s',
        size: 1000,
        body: body
      }, function getMoreUntilDone(error, response) {
        if (error) {
          deferred.reject(error);
          return;
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
            .value();

          deferred.resolve(deployments);
        }
      });

      return promise;
    };

    this.deleteDeployment = function (appName, deployerUrl) {
      return $http.delete(deployerUrl + '/apps/' + appName);
    };

    this.restoreDeployment = function (appName, version, state, deployerUrl) {
      return $http.post(deployerUrl + '/recovery', {
        name: appName,
        version: version,
        state: state
      });
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
          filtered: {
            filter: {
              bool: {
                must: [{
                  term: {
                    'meta-info.job-id': jobId
                  }
                }]
              }
            }
          }
        }
      };

      esClient.search({
        index: config.elasticsearch.index,
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
            .sortBy('date')
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

  .service('logs', ['config', '$websocket', function(config, $websocket) {
    var cache = {};

    this.connect = function() {
      var domain = config.domain;

      // TODO: determine if we should cache the websocket handle or not
      if (!cache[domain]) {
        cache[domain] = 'wss://totem-logs.' + domain + '/logs';
      }

      return $websocket(cache[domain]);
    };
  }])
;

})();
