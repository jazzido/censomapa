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
    VARIABLE_TOTAL_RE: new RegExp('<VARIABLE_TOTAL>', 'g'),
    QUERY_PREFIX: 'https://www.googleapis.com/fusiontables/v1/query?typed=false&sql=',
    GET_VARIABLE_QUERY: 'SELECT DNE_ID, <VARIABLE> FROM <TABLE>',
    GET_VARIABLE_RATIO_QUERY: 'SELECT DNE_ID, <VARIABLE>, <VARIABLE_TOTAL>  FROM <TABLE>'
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

FTClient.prototype.getVariableRatio = function(variable_name, variable_total_name, callback) {
    var q = FTClient.config.GET_VARIABLE_RATIO_QUERY.replace(FTClient.config.VARIABLE_RE, variable_name);
    q = q.replace(FTClient.config.VARIABLE_TOTAL_RE, variable_total_name);
    this.executeQuery(q,
                      function(json) {
                          var h = {};
                          json.rows.forEach(function(i) { h[i[0]] = parseFloat(i[1]) / parseFloat(i[2]); });
                          callback(h);
                      });
};


// ---------- END Fusion Tables Client ----------
