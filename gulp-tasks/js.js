/** Build JS files */

var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    merge = require('merge-stream')
;

var conf = require('./conf').conf;

var js_all = require('./conf').js_all; 
var js_vendor = require('./conf').js_vendor; 


/** build js */

gulp.task('js_vendor', function(){
    gulp.src([ 
        'lib/d3.v3.js',
        'lib/jquery-1.9.1.min.js',
        'lib/jquery.ba-hashchange.js',
        'lib/topojson.v0.min.js',
        'lib/handlebars.js',
        'lib/spin.min.js',
        'lib/scripts.js',
        'lib/jenks.js'
     ], { cwd: conf.app_cwd })
        .pipe(uglify())
        .pipe(concat(js_vendor))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(conf.dest+ "js"));

});

gulp.task('js_all', function(){
    //combine all js files of the app

    gulp.src([
        'js/censomapa.js', 'js/app.js'
        ], { cwd: conf.app_cwd })
        .pipe(uglify())
        .pipe(concat(js_all))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(conf.dest+ "js"));

});