var gulp    = require('gulp');
var haml    = require('gulp-haml');
var sass    = require('gulp-sass');
var inline  = require('gulp-inline');
var uglify  = require('gulp-uglify');
var cssmin  = require('gulp-cssmin');
var htmlmin = require('gulp-htmlmin');

var hamlTask = function() {
  return gulp.src('./src/*.haml')
    .pipe(haml())
    .pipe(gulp.dest('./public'));
};

gulp.task('haml', hamlTask);

var sassTask = function() {
  return gulp.src('./src/scss/*.scss')
    .pipe(sass({
      includePaths: ['./node_modules']
    }))
    .pipe(gulp.dest('./public/css'));
};

gulp.task('sass', sassTask);

var htmlTask = function() {
  return gulp.src('./public/*.html')
    .pipe(htmlmin())
    .pipe(gulp.dest('./public'));
};

gulp.task('html', ['sass', 'haml'], htmlTask);

var buildTask = function() {
  sassTask();
  hamlTask();
  htmlTask();
};

gulp.task('build', buildTask);

var watchTask = function() {
  buildTask();

  gulp.watch('./src/scss/*.scss', ['sass']);
  gulp.watch('./src/*.haml', ['haml']);
};

gulp.task('watch', watchTask);

gulp.task('default', buildTask);
