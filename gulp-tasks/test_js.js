/** test JS */

var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish')
;

var conf = require('./conf').conf;


gulp.task('test_js', function(){
    return gulp.src(['js/app.js', 'js/censomapa.js'], { cwd: conf.app_cwd })
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter(stylish));
});