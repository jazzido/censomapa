/** SERVER TASKS */

var gulp = require('gulp'),
    connect = require('gulp-connect')
;

var conf = require('./conf').conf;

gulp.task('connect', function() {
  connect.server({
    root: conf.app_cwd,
    livereload: true,
    port:8080
  });
});


gulp.task('reload', ['test_js'], function () {
  gulp.src('*.html', { cwd: conf.app_cwd })
    .pipe(connect.reload());
});
 

gulp.task('watch', function () {
  gulp.watch(['app/*.html', 'app/**/*.css', 'app/js/**/*.js' ], ['reload']);
});


// development server
gulp.task('server', ['test_js', 'connect', 'watch']);


// production server
gulp.task('server_pro', function() {
  connect.server({
    root: './build',
    port:9000
  });
});

// default task
gulp.task('default', function() {
  console.log("application");
});