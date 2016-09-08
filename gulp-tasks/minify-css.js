/** mify css files */

var gulp = require('gulp'),
    minifyCSS = require('gulp-minify-css'),
    concat = require('gulp-concat')
;

var conf = require('./conf').conf;

var css_file_min = require('./conf').css_file_min; 


gulp.task('minify-css', function () {
/** debe mantener el orden */
    gulp.src([ 
                'css/choropleth_colors.css',
                'css/colorbrewer.css',
                'css/styles.css',
            ], { cwd: conf.app_cwd })
    .pipe(minifyCSS())
    .pipe(concat(css_file_min))
    .pipe(gulp.dest(conf.dest+'css'));

});