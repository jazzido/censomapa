/**
 * simple JSONP support
 *
 *     JSONP.get('https://api.github.com/gists/1431613', function (data) { console.log(data); });
 *     JSONP.get('https://api.github.com/gists/1431613', {}, function (data) { console.log(data); });
 *
 * gist: https://gist.github.com/gists/1431613
 */
var JSONP = (function (document) {
    var requests = 0,
        callbacks = {};

    return {
        /**
         * makes a JSONP request
         *
         * @param {String} src
         * @param {Object} data
         * @param {Function} callback
         */
        get: function (src, data, callback) {
            // check if data was passed
            if (!arguments[2]) {
                callback = arguments[1];
                data = {};
            }

            // determine if there already are params
            src += (src.indexOf('?')+1 ? '&' : '?');

            var head = document.getElementsByTagName('head')[0],
                script = document.createElement('script'),
                params = [],
                requestId = requests,
                param;

            // increment the requests
            requests++;

            // create external callback name
            data.callback = 'JSONP.callbacks.request_' + requestId;

            // set callback function
            callbacks['request_' + requestId] = function (data) {
                // clean up
                head.removeChild(script);
                delete callbacks['request_' + requestId];

                // fire callback
                callback(data);
            };

            // traverse data
            for (param in data) {
                params.push(param + '=' + encodeURIComponent(data[param]));
            }

            // generate params
            src += params.join('&');

            // set script attributes
            script.type = 'text/javascript';
            script.src = src;

            // add to the DOM
            head.appendChild(script);
        },

        /**
         * keeps a public reference of the callbacks object
         */
        callbacks: callbacks
    };
})(document);


// ---------- BEGIN Fusion Tables Client ----------
var FTClient = function(table_id, api_key) {
    this.table_id = table_id;
    this.api_key = api_key;
};

FTClient.config = {
    TABLE_RE: new RegExp('<TABLE>', 'g'),
    VARIABLE_RE: new RegExp('<VARIABLE>', 'g'),
    QUERY_PREFIX: 'https://www.googleapis.com/fusiontables/v1/query?typed=false&sql=',
    GET_VARIABLE_QUERY: 'SELECT DNE_ID, <VARIABLE> FROM <TABLE>',
    GET_MAX_MIN_VARIABLE_QUERY: 'SELECT MAXIMUM(<VARIABLE>), MINIMUM(<VARIABLE>) FROM <TABLE>',
};

FTClient.prototype.executeQuery = function(query, cb) {
    JSONP.get(encodeURI(FTClient.config.QUERY_PREFIX + query.replace(FTClient.config.TABLE_RE, this.table_id) + '&key=' + this.api_key),
             cb)
};

FTClient.prototype.getVariable = function(variable_name, callback) {
    this.executeQuery(FTClient.config.GET_VARIABLE_QUERY.replace(FTClient.config.VARIABLE_RE,
                                                                 variable_name),
                      function(json) {
                          var h = {};
                          json.rows.forEach(function(i) { h[i[0]] = i[1]; });
                          callback(h);
                      });
};

FTClient.prototype.getMaxMinVariable = function(variable_name, callback) {
    this.executeQuery(FTClient.config.GET_MAX_MIN_VARIABLE_QUERY.replace(FTClient.config.VARIABLE_RE,
                                                                        variable_name),
                     function(json) {
                         callback(parseFloat(json.rows[0][0]),
                                  parseFloat(json.rows[0][1]));
                     });
};


// ---------- END Fusion Tables Client ----------
