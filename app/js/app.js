$(function() {
    //        var map_data;

    var to_id = function(str) {
        return str.replace(/\s+/g, '-').toLowerCase();
    };

    var memoize = function(func) {
        var memo = {};
        var slice = Array.prototype.slice;
        return function() {
            var args = slice.call(arguments);
            if (args in memo)
                return memo[args];
            else
                return (memo[args] = func.apply(this, args));
        }
    };

//    var map_data;
    var distrito_info_dict = {};

    Handlebars.registerHelper('lower', function(str) {
        return str.toLowerCase();
    });
    Handlebars.registerHelper('mais_um', function(context) {
        return context + 1;
    });
    Handlebars.registerHelper('to_id', to_id);

    var DISTRITO_INFO_TMPL = Handlebars.compile($('#distrito-info-template').html());
    var RANKING_TABLE_TMPL = Handlebars.compile($('#tabla-ranking-template').html());
    var tooltip_el = $('#tooltip');
    var ranking_tbody_el = $('#ranking tbody');

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

    filterRankingTable = function(provincia_id) {
        if (provincia_id)
            $('#ranking tbody tr')
              .not('[data-provincia="'+provincia_id+'"]')
              .css('display', 'none');
        else
            $('#ranking tbody tr').css('display', 'table-row');

    };

    $(window).hashchange( function(){
        if (location.hash.indexOf('#') !== 0) return;

        // dibujar el mapa
        var data;
        if (data = interpretFragment(location.hash, map_data)) {
            mapa.drawMap(data, 5);

            // setear 'active' en el boton correspondiente
            $('#variables li').removeClass('active');
            $('#variables a[href="'+ location.hash +'"]').parent().addClass('active');
            // setear el título
            var t = $('a[href="'+location.hash+'"]').attr('title').split('—');
            t = '<strong>' + t[0] + '</strong> — ' + t[1];
            $('nav h2, #ranking th').html(t);

            // actualizar la tabla de ranking
            for (var k in data)
                if (distrito_info_dict[k])
                    distrito_info_dict[k].data = data[k];

            ranking_tbody_el.html(RANKING_TABLE_TMPL({
                data: d3.entries(distrito_info_dict).sort(function(a,b) {
                    return a.value.data - b.value.data;
                })
            }));

            filterRankingTable(mapa.zoomedTo);
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
        var tootip = new moverObjMouseOver($("path"), $("#tooltip"), $("svg"));

        // popular distrito_info_dict (convenience)
        topojson.objects.departamentos.geometries.forEach(function(g) {
            distrito_info_dict[g.id] = g.properties;
        });

        // tooltip en mouseover sobre los distritos
        $('.departamentos path')
            .on('mouseover', function() {
                $(this).css('opacity', 0.1);
                showDistritoTooltip(this);
            })
            .on('mouseout', function() { $(this).css('opacity', 1); });

        $('.departamentos').on('mouseout', function() {
            hideDistritoTooltip();
        });

        // cargar datos
        $.get('data/data.json',
              function(data) {
                  map_data = data; // carga inicial de todos los datos

                  // disparo evento hashchange para carga inicial
                  $(window).trigger('hashchange');

                  $('g.mapa g.departamentos g').on('click', function() {
                      var id = $(this).attr('id').split(/provincia-(.+)/)[1];
                      var zoomTo = id == mapa.zoomedTo ? null : id;

                      if (!zoomTo || mapa.zoomedTo) filterRankingTable(null);
                      if (zoomTo) filterRankingTable(id);

                      mapa.zoomToProvincia(zoomTo);
                  });
              });
    });
});
