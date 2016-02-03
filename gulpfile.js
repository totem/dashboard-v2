'use strict';

/*jshint strict: true */
/*globals require,process*/

var gulp = require('gulp'),
    connect = require('gulp-connect'),
    serve = require('gulp-serve'),
    sass = require('gulp-sass'),
    jshint = require('gulp-jshint'),
    clean = require('gulp-clean'),
    ngConstant = require('gulp-ng-constant'),
    karma = require('karma').Server,
    protractor = require('gulp-protractor'),
    inject = require('gulp-inject');

// All the test dependencies
var protractorConfigFile = './protractor.conf.js',
    protractorConfig = require(protractorConfigFile).config;

var opts = {};
var paths = opts.paths = {};

// List of bower files to inject
// globs will work
opts.inject = {
  target: ['app/**/*.html', '!app/bower/**/*.html'],
  bower: [
    'app/bower/jquery/dist/jquery.min.js',
    'app/bower/lodash/lodash.min.js',
    'app/bower/moment/moment.js',
    'app/lib/ansiparse/ansiparse.js',
    'app/bower/angular/angular.js',
    'app/bower/angular-ui-router/release/angular-ui-router.js',
    'app/bower/angular-animate/angular-animate.js',
    'app/bower/angular-aria/angular-aria.js',
    'app/bower/angular-messages/angular-messages.js',
    'app/bower/angular-sanitize/angular-sanitize.js',
    'app/bower/angular-websocket/angular-websocket.js',
    'app/bower/angular-ui-tree/dist/angular-ui-tree.js',
    'app/bower/angular-gantt/assets/angular-gantt.js',
    'app/bower/angular-gantt/assets/angular-gantt-plugins.js',
    'app/bower/angular-moment/angular-moment.js',
    'app/bower/angular-material/angular-material.js',
    'app/bower/elasticsearch/elasticsearch.angular.js',
    'app/bower/json-formatter/dist/json-formatter.js',
    'app/bower/DateJS/build/production/date.min.js',
    'app/bower/angular-loading-bar/build/loading-bar.min.js',
    'app/bower/angular-hotkeys/build/hotkeys.min.js'
  ],
  app: [
    'app/app.js',
    'app/config.js',
    'app/components/**/*.js'
  ],
  testing: [
    'app/bower/angular-mocks/angular-mocks.js'
  ],
  exclude: [
    '!app/components/**/*.test.js'
  ],
  sources: [],  // used for injecting into the html files, built below
  extra: {
    ignorePath: 'app'
  }
};

// concat the injection lists for the html files
opts.inject.sources = opts.inject.bower.concat(opts.inject.app.concat(opts.inject.exclude));

opts.karma = {
  configFile: __dirname + '/karma.conf.js',
  files: opts.inject.bower.concat(opts.inject.testing.concat(opts.inject.app)), // build file list for testing harness
  preprocessors: {
    'app/**/*.html': ['ng-html2js'],
    'app/components/**/!(*test).js': ['coverage']
  },
  ngHtml2JsPreprocessor: {
    stripPrefix: 'app/',
    moduleName: 'gulpAngular'
  },
  singleRun: true
};

// general destination path
paths.dist = 'dist';

// Define Bower specific paths
paths.bower = {
  src: 'app/bower/**/*',
  dist: paths.dist + '/bower'
};

// Define SASS specific paths
paths.sass = {
  src: [
    'app/**/*.scss',
    '!app/bower/**/*.scss'
  ],
  inplace: function(file) {
    // Put the file in the same folder.
    return file.base;
  }
};

paths.tests = [
  'app/**/*.test.js',
  '!app/bower/**/*.js'
];

gulp.task('styles', function() {
  gulp.src(paths.sass.src)
    .pipe(sass({
      precision: 10
    }))
    .pipe(gulp.dest(paths.dist))
    .pipe(connect.reload());
});

gulp.task('html', function() {
  var target = gulp.src(opts.inject.target);
  var sources = gulp.src(opts.inject.sources, {read: false});

  return target
    .pipe(inject(sources, opts.inject.extra))
    .pipe(gulp.dest(paths.dist))
    .pipe(connect.reload());
});

gulp.task('scripts', ['html'], function () {
  return gulp.src(['app/**/*.js', '!app/bower/**/*.js', '!app/lib/**/*.js', '!app/config.js'])
    .pipe(jshint())
    .pipe(jshint.reporter(require('jshint-stylish')))
    .pipe(gulp.dest(paths.dist))
    .pipe(connect.reload());
});

gulp.task('images', function() {
  return gulp.src(['app/img/**/*'])
    .pipe(gulp.dest(paths.dist + '/img'))
    .pipe(connect.reload());
});

gulp.task('libraries', function() {
  return gulp.src(['app/lib/**/*'])
    .pipe(gulp.dest(paths.dist + '/lib'))
    .pipe(connect.reload());
})

gulp.task('assemble', ['bower', 'styles', 'libraries', 'html', 'scripts', 'images']);
gulp.task('build', ['assemble']);

gulp.task('config', function () {
  gulp.src('app/config.json')
    .pipe(ngConstant({
      name: 'totemDashboard',
      deps: false,
      constants: {
        totemConfigUrl: process.env.TOTEM_DASHBOARD_CONFIG
      }
    }))
    // Writes config.js to dist/ folder
    .pipe(gulp.dest(paths.dist))
    .pipe(connect.reload());
});

gulp.task('bower', function() {
  gulp.src(paths.bower.src)
    .pipe(gulp.dest(paths.bower.dist))
    .pipe(connect.reload());
});

gulp.task('clean', function () {
  gulp.src([paths.dist], { read: false })
    .pipe(clean());
});

// Test harness
gulp.task('webdriver', protractor.webdriver_update);

gulp.task('test', ['test:karma']);

// Karma test runner
gulp.task('test:karma', ['config', 'serve:test'], function (done) {
  new karma(opts.karma, function () {
    connect.serverClose();

    done();
  }).start();
});

// Protractor test runner
gulp.task('test:e2e', ['webdriver', 'serve:test'], function () {
  gulp
    .src(protractorConfig.specs)
    .pipe(protractor.protractor({
      configFile: protractorConfigFile
    }))
    .on('end', function () {
      connect.serverClose();
    });
});

gulp.task('test:e2e:debug', ['webdriver', 'serve:test'], function () {
  gulp
    .src(protractorConfig.specs)
    .pipe(protractor.protractor({
      args: [
        'debug'
      ],
      configFile: protractorConfigFile
    }))
    .on('end', function () {
      connect.serverClose();
    });
  });

gulp.task('livereload', function() {
  gulp.watch(paths.sass.src, ['build']);
  gulp.watch(['app/**/*.html', '!app/bower/**/*'], ['build']);
  gulp.watch(['app/**/*.js', '!app/bower/**/*'], ['build']);
});

gulp.task('serve', function() {
  connect.server({
    root: 'dist',
    livereload: true,
    port: 3000
  });
});

gulp.task('serve:test', ['config'], function() {
  connect.server({
    root: 'dist',
    livereload: false,
    port: 3000
  });
});

gulp.task('serve:prod', ['config'], serve({
    root: ['dist'],
    port: 3000
}));

// Default task
gulp.task('default', ['assemble', 'config', 'livereload', 'serve']);
