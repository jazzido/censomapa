/** global configs */

var conf = {
        app_cwd:'app/',
        dest:'build/',
        commit: Math.floor(Date.now() / 1000)
    };


var js_all = 'all.v'+conf.commit+'.min.js';
var js_vendor = 'vendor.v'+conf.commit+'.min.js';
var css_file_min = 'all.v'+conf.commit+'.min.css';


module.exports.conf = conf; 
module.exports.js_all = js_all; 
module.exports.js_vendor = js_vendor; 
module.exports.css_file_min = css_file_min; 