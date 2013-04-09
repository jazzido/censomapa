$(function() {
    //        var map_data;

    var map_data;
    var distrito_info_dict = {};

    Handlebars.registerHelper('lower', function(str) {
        return str.toLowerCase();
    });
    var DISTRITO_INFO_TMPL = Handlebars.compile($('#distrito-info-template').html());
    var RANKING_TABLE_TMPL = Handlebars.compile($('#tabla-ranking-template').html());
    var tooltip_el = $('#tooltip');
    var ranking_table_el = $('#ranking');

    getVariable = memoize(function(data, variable_name, year) {
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

    // obtener datos de acuerdo al fragment (hash) del URL
    interpretFragment = function(fragment, data) {
        var parts = fragment.substring(1).split('-');
        var var_name = parts[0], arg2 = parts[1], arg3 = parts[2];

        var rv = null;
        if (arg2 == 'intercensal')
            rv = getIntercensalVariation(data, var_name);
        else if (arg2 == 'ratio')
            rv = getVariableAsRatio(data, var_name, arg3, var_name.split('_')[0] + '_Total');
        else
            rv = getVariable(data, var_name, arg2);

        return rv;

    };

    $(window).hashchange( function(){
        if (location.hash.indexOf('#') !== 0) return;

        // dibujar el mapa
        var data;
        if (data = interpretFragment(location.hash, map_data)) {
            mapa.drawMap(data, 5);

            // setear el título
            $('nav h2').html($('a[href="'+location.hash+'"]').attr('title'));

            // actualizar la tabla de ranking
            for (var k in data)
                if (distrito_info_dict[k])
                    distrito_info_dict[k].data = data[k];

            ranking_table_el.html(RANKING_TABLE_TMPL({
                data: d3.entries(distrito_info_dict).sort(function(a,b) {
                    return a.value.data - b.value.data;
                })
            }));
        }
    });

    showDistritoTooltip = function(distrito_path) {
        tooltip_el
            .html(DISTRITO_INFO_TMPL(distrito_path.__data__.properties))
            .css('visibility', 'visible');
    };

    hideDistritoTooltip = function() { tooltip_el.css('visibility', 'hidden'); }

    $(document).on({
        mouseenter: function() {
            showDistritoTooltip($('path#' + $(this).data('id'))[0]);
        },
        mouseleave: hideDistritoTooltip
    }, '#ranking tbody tr');


    // cargar geometrias
    $.get('data/ea.json', function(topojson) {
        mapa.drawPaths(topojson, 'article#svg');

        // popular distrito_info_dict (convenience)
        topojson.objects.departamentos.geometries.forEach(function(g) {
            distrito_info_dict[g.id] = g.properties;
        });

        // tooltip en mouseover sobre los distritos
        $('.departamentos path').on('mouseover', function() {
            showDistritoTooltip(this);
        });
        $('.departamentos').on('mouseout', hideDistritoTooltip);



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
