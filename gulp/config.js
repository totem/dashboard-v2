'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')();

module.exports = function(options) {
  gulp.task('config', function () {
    return gulp.src('config.json')
      .pipe($.ngConstant({
        name: 'totemDashboard',
        deps: false,
        constants: {
          totemConfigUrl: process.env.TOTEM_DASHBOARD_CONFIG
        }
      }))
      .pipe(gulp.dest(options.tmp + '/serve'));
  });
};
