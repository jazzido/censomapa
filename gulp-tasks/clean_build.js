var gulp = require('gulp')
    clean = require('gulp-clean');

var conf = require('./conf').conf;

// default task
gulp.task('clean_build', function() {
    
    return gulp.src([conf.dest], {read: false})
        .pipe(clean({force: true}));
});