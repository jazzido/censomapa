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

    var DataAccessor = function(data) {
        var data = data;

        this.getVariable = memoize(function(variable_name, year) {
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

        this.getVariableAsRatio = memoize(function(variable_name, year, variable_total) {
            var values = this.getVariable(variable_name, year);
            var totals = this.getVariable(variable_total, year);

            var rv = {};
            for (var dpto_id in values) {
                rv[dpto_id] = (values[dpto_id] / totals[dpto_id]).toFixed(2) * 100;
            }
            return rv;
        });

        this.getIntercensalVariation = memoize(function(variable_name) {
            var values_2001 = this.getVariable(variable_name, 2001);
            var values_2010 = this.getVariable(variable_name, 2010);
            var rv = {};
            for (var dpto_id in values_2001) {
                rv[dpto_id] = (values_2010[dpto_id] / (values_2001[dpto_id] == 0 ? 1 : values_2001[dpto_id]) - 1).toFixed(2) * 100;
            }
            return rv;
        });
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

    // obtener datos de acuerdo al fragment (hash) del URL
    interpretFragment = function(fragment, data_accessor) {
        var parts = fragment.substring(1).split('-');
        var var_name = parts[0], arg2 = parts[1], arg3 = parts[2];

        var rv = null;
        if (arg2 == 'intercensal')
            rv = data_accessor.getIntercensalVariation(var_name);
        else if (arg2 == 'ratio')
            rv = data_accessor.getVariableAsRatio(var_name, arg3, var_name.split('_')[0] + '_Total');
        else
            rv = data_accessor.getVariable(var_name, arg2);

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

            // setear clase del mapa segun unidad de relevamiento
            var m = location.hash.match(/^#(Viviendas|Poblacion|Hogares)/);
            if (m.length == 2) 
                $('svg').attr('class', m[1]);

            // setear 'active' en el boton correspondiente
            $('.variables li.active').removeClass('active');
            $('.variables a[href="'+ location.hash +'"]').parent().addClass('active');

            // setear el título
            var t = $('a[href="'+location.hash+'"]').attr('title').split('—');
            t = '<strong>' + t[0] + '</strong> — ' + t[1];
            $('nav h2, #ranking th').html(t);

            // actualizar la tabla de ranking
            // TODO optimizar.
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
        var tootip = new moverObjMouseOver($("path, #ranking"), $("#tooltip"), $("svg"));

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
                  map_data = new DataAccessor(data);

                  // disparo click sobre los tabs correspondientes en carga inicial
                  if (location.hash.indexOf('#') == 0) {
                      var m = location.hash.match(/^#(Viviendas|Poblacion|Hogares)/);
                      if (m.length == 2) 
                          $('#filtros h3:contains('+m[1]+')').parent().trigger('click')
                      
                  }

                  // disparo evento hashchange en carga inicial
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
