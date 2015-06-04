'use strict';

angular.module('totemDashboard')
  .service('client', function (env, esFactory) {
    var cache = {};

    this.get = function () {
      var host = env.get().elasticsearch.url;

      if (cache[host]) {
        return cache[host];
      }

      return (cache[host] = esFactory({
        host: host,
        apiVersion: '1.5',
        log: 'trace'
      }));
    };
  })

  .service('api', function (client, $filter, env) {
    this.sanitizeData = function (data) {
      var cleanData = [];

      for (var i = 0; i < data.length; i++) {
        if (data[i]._source['meta-info']) {
          var cleanObj = {
            date: data[i]._source.date,
            difference: $filter('amDifference')(data[i]._source.date, null, 'seconds') * -1,
            owner: data[i]._source['meta-info'].git.owner,
            repo: data[i]._source['meta-info'].git.repo,
            ref: data[i]._source['meta-info'].git.ref,
            original: data[i]._source
          };

          cleanData.push(cleanObj);
        }
      }

      return cleanData;
    };

    this.search = function (opts) {
      var self = this,
          query = {
            bool: {
              must: [
                {match: {type: 'NEW_JOB'}}
              ]
            }
          };

      for (var param in opts.query) {
        if (opts.query[param]) {
          var newQuery = {regexp: {}};
          newQuery.regexp['meta-info.git.' + param] = '.*(' + opts.query[param] + ').*';
          query.bool.must.push(newQuery);
        }
      }

      return client.get().search({
        index: env.get().elasticsearch.index,
        type: 'events',
        size: opts.size,
        from: opts.from,
        body: {
          sort: [{date: {order: 'desc'}}],
          query: query
        }
      }).then(function (resp) {
        return {
          data: self.sanitizeData(resp.hits.hits),
          total: resp.hits.total
        };
      });
    };
  })
;
