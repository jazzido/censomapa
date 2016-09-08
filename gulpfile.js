var gulp = require('gulp');

var requireDir = require('require-dir');
requireDir('./gulp-tasks'),
runSequence = require('run-sequence')
;

var conf = require('./gulp-tasks/conf');


// default task
gulp.task('default', ['server']);

gulp.task('build', function() {
  
    runSequence(
        'clean_build',
        ['js_vendor', 'js_all', 'minify-css', 'copy'],
        function(){
            console.log("Build on ----> %s <---- ok!", conf.dest);
        });
});