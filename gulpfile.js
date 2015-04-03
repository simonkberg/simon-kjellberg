var gulp = require('gulp');
var haml = require('gulp-haml');

gulp.task('haml', function() {
  gulp.src('./src/*.haml')
    .pipe(haml())
    .pipe(gulp.dest('./public'));
});

gulp.task('watch', function() {
  gulp.run('default');
  gulp.watch('./src/*.haml', ['haml']);
});

gulp.task('default', function() {
  gulp.run('haml');
});
