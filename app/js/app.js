$(function() {
    //        var map_data;

    /*var*/ getVariable = memoize(function(data, variable_name, year) {
        var col_idx = data['_column_names'].indexOf(variable_name);
        var year_idx = data['_years'].indexOf(year.toString());
        if (col_idx == -1 || year_idx == -1) return null;
        var rv = {};
        for (var dpto_id in data['_districts']) {
            var v = data['_districts'][dpto_id][year_idx][col_idx];
            if (v !== null) rv[dpto_id] = v;
        }
        return rv;
    });

    getVariableAsRatio = memoize(function(data, variable_name, year, variable_total) {
        var values = getVariable(data, variable_name, year);
        var totals = getVariable(data, variable_total, year);

        var rv = {};
        for (var dpto_id in values) {
            rv[dpto_id] = values[dpto_id] / totals[dpto_id];
        }
        return rv;
    });

    getIntercensalVariation = memoize(function(data, variable_name) {
        var values_2001 = getVariable(data, variable_name, 2001);
        var values_2010 = getVariable(data, variable_name, 2010);
        var rv = {};
        for (var dpto_id in values_2001) {
            rv[dpto_id] = (values_2010[dpto_id] - values_2001[dpto_id]) / values_2001[dpto_id];
        }

        return rv;
    });

    drawMap = function(data, var_name, arg2, arg3) {
        var rv = null;
        if (arg2 == 'intercensal') {
            mapa.drawMap(getIntercensalVariation(map_data, var_name), 5);
            rv = true;
        }
        else if (arg2 == 'ratio') {
            var year = arg3;
            console.log(var_name, arg3, var_name.split('_')[0] + '_Total');
            mapa.drawMap(getVariableAsRatio(data, var_name, arg3, var_name.split('_')[0] + '_Total'), 5);
            rv = true;
        }
        else {
            mapa.drawMap(getVariable(data, var_name, arg2), 5);
            rv = true;
        }
        return rv;
    };

    // tooltip en mouseover sobre los distritos
    $('.departamentos path').on('mouseover', function() {

    });

    $(window).hashchange( function(){
        // dibujar el mapa y setear el título
        if (location.hash.indexOf('#') !== 0) return;
        if (drawMap.apply(null, [map_data].concat(location.hash.substring(1).split('-'))) === null) return;
        $('nav h2').html($('a[href="'+location.hash+'"]').attr('title'));
    });

    // cargar geometrias
    $.get('data/ea.json', function(topojson) {
        mapa.drawPaths(topojson, 'article#svg');
        // cargar datos
        $.get('data/data.json',
              function(data) {
                  map_data = data; // carga inicial de todos los datos

                  // disparo evento hashchange para carga inicial
                  $(window).trigger('hashchange');
                  $('g.mapa g.departamentos g').on('click', function() {
                      var id = $(this).attr('id').split(/provincia-(.+)/)[1];
                      mapa.zoomToProvincia(id == mapa.zoomedTo ? null : id);
                  });
              });
    });
});
