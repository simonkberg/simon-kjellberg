var gulp     = require('gulp'),
    del      = require('del'),
    sequence = require('run-sequence').use(gulp),
    jade     = require('gulp-jade'),
    sass     = require('gulp-sass'),
    inline   = require('gulp-inline-source'),
    uglify   = require('gulp-uglify'),
    htmlmin  = require('gulp-htmlmin');

var dir = {
  dist: './public',
  src: './src'
};

var path = {
  jade: dir.src + '/*.jade',
  sass: dir.src + '/scss/*.scss',
  html: dir.dist + '/*.html',
  css: dir.dist + '/css'
};

var cleanTask = function(cb) {
  del([dir.dist + '/**/*', '!**/.git**'], cb);
};

gulp.task('clean', cleanTask);

var jadeTask = function() {
  var stream = gulp.src(path.jade)
    .pipe(jade())
    .pipe(gulp.dest(dir.dist));

  return stream;
};

gulp.task('jade', jadeTask);

var sassTask = function() {
  var opt = {
    includePaths: ['node_modules'],
    outputStyle: 'compressed'
  };

  var stream = gulp.src(path.sass)
    .pipe(sass(opt))
    .pipe(gulp.dest(path.css));

  return stream;
};

gulp.task('sass', sassTask);

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

  var stream = gulp.src(path.html)
    .pipe(inline(opt.inline))
    .pipe(htmlmin(opt.minify))
    .pipe(gulp.dest('public'));

  return stream;
};

gulp.task('html', ['sass', 'jade'], htmlTask);

gulp.task('build', ['clean'], function(cb) {
  // TODO: fix once gulp4 is released
  sequence('html', cb);
});

var watchTask = function() {
  // TODO: fix once gulp4 is released
  sequence(['sass', 'jade']);

  gulp.watch(path.sass, ['sass']);
  gulp.watch(path.jade, ['jade']);
};

gulp.task('watch', ['clean'], watchTask);

gulp.task('default', ['build']);
