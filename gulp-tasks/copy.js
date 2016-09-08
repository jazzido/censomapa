var gulp = require('gulp'),
    merge = require('merge-stream'),
    htmlreplace = require('gulp-html-replace'),
    minifyHTML = require('gulp-minify-html')
;
var conf = require('./conf').conf;

var js_all = require('./conf').js_all; 
var js_vendor = require('./conf').js_vendor; 
var css_file_min = require('./conf').css_file_min; 


gulp.task('copy', function () {
    var opts = {
        conditionals: true,
        spare:true
    };

    var html = gulp.src('*.html', { cwd: conf.app_cwd })
    gulp.src([
        '*.html'
        ], { cwd: conf.app_cwd })
        .pipe(htmlreplace({
            js: [
                'js/'+js_vendor,
                'js/'+js_all
                ],
            css: ['css/'+css_file_min]
        }))
        .pipe(minifyHTML(opts))
        .pipe(gulp.dest(conf.dest));
    
    var fonts = gulp.src('css/font/*', { cwd: conf.app_cwd })
        .pipe(gulp.dest(conf.dest+'css/font'));
    
    // var favicon = gulp.src('favicon.ico', { cwd: conf.app_cwd })
    //     .pipe(gulp.dest(conf.dest));

    var img = gulp.src(['img/**/*'], { cwd: conf.app_cwd })
        .pipe(gulp.dest(conf.dest+'img'));

    // var css_img = gulp.src(['css/images/**/*'], { cwd: conf.app_cwd })
    //     .pipe(gulp.dest(conf.dest+'css/images'));

    var data = gulp.src('data/*', { cwd: conf.app_cwd })
        .pipe(gulp.dest(conf.dest+'data'));
        
   // var templates = gulp.src('templates/*', { cwd: conf.app_cwd })
   //      .pipe(gulp.dest(conf.dest+'templates'));
        
    return merge(html, fonts, img, data);
});
