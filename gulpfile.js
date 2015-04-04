var gulp    = require('gulp');
var del     = require('del');
var path    = require('path');
var jade    = require('gulp-jade');
var sass    = require('gulp-sass');
var inline  = require('gulp-inline-source');
var uglify  = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');

var cleanTask = function(cb) {
  del(['public/**/*', '!**/.git**'], cb);
};

gulp.task('clean', cleanTask);

var jadeTask = function() {
  var stream = gulp.src('src/*.jade')
    .pipe(jade())
    .pipe(gulp.dest('public'));

  return stream;
};

gulp.task('jade', jadeTask);
gulp.task('jade:build', ['clean'], jadeTask);

var sassTask = function() {
  var opt = {
    includePaths: ['node_modules']
  };

  var stream = gulp.src('src/scss/*.scss')
    .pipe(sass(opt))
    .pipe(gulp.dest('public/css'));

  return stream;
};

gulp.task('sass', sassTask);
gulp.task('sass:build', ['clean'], sassTask);

var htmlTask = function() {
  var opt = {
    minify: {
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: false
    },
    inline: {
      compress: true
    }
  };

  var stream = gulp.src('public/*.html')
    .pipe(inline(opt.inline))
    .pipe(htmlmin(opt.minify))
    .pipe(gulp.dest('public'));

  return stream;
};

gulp.task('html', ['clean', 'sass:build', 'jade:build'], htmlTask);

gulp.task('build', ['clean', 'sass:build', 'jade:build', 'html']);

var watchTask = function() {
  sassTask();
  jadeTask();

  gulp.watch('src/scss/*.scss', ['sass']);
  gulp.watch('src/*.jade', ['jade']);
};

gulp.task('watch', ['clean'], watchTask);

gulp.task('default', ['build']);
