var gulp = require('gulp');
var rename = require('gulp-rename');
var webpack = require('webpack-stream');
var connect = require('gulp-connect');
var plugins = require('gulp-load-plugins')();
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');

gulp.task('build-js', function() {
  return gulp.src('js/app.js')
    .pipe(plumber())
    .pipe(webpack({
      devtool: 'eval-source-map',
      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader'
          },
        ],
      },
    }))
    .pipe(rename('app.js'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('build-sass', function () {
  gulp.src('./css/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist'));
});

gulp.task('build-html', function() {
  return gulp.src('index.html')
    .pipe(gulp.dest('./dist'))
});

gulp.task('setup-watchers', function(callback) {
  process.env.WEBPACK_WATCH = true;
  gulp.watch(['js/**/*'], ['build-js']);
  gulp.watch(['css/**/*.scss'], ['build-sass']);
  callback();
});

gulp.task('webserver', ['build-js', 'build-sass', 'build-html'], function () {
  connect.server({root: 'dist'});
});

gulp.task('default', ['setup-watchers', 'webserver']);

gulp.task('jasmine', function() {
  var plugin = new (require('gulp-jasmine-browser/webpack/jasmine-plugin'))();
  return gulp.src('spec/**/*_spec.js')
    .pipe(webpack({
      devtool: 'eval',
      watch: true,
      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader'
          }
        ]
      },
      output: {filename: 'spec.js'},
      plugins: [plugin]
    }))
    .pipe(plugins.jasmineBrowser.specRunner())
    .pipe(plugins.jasmineBrowser.server(plugin.whenReady));
});

gulp.task('build-gh-pages', ['build-js', 'build-sass', 'build-html'], function () {
  return gulp.src(['dist/*'])
    .pipe(gulp.dest('docs/'))
});