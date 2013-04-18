$(function() {

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

    Object.extend = function(destination, source) {
        var property;
        for (property in source) {
            if (source.hasOwnProperty(property)) {
                destination[property] = source[property];
            }
        }
        return destination;
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
                rv[dpto_id] = (values[dpto_id] / (totals[dpto_id] || 0.1)).toPrecision(5) * 100;
            }
            return rv;
        });

        this.getIntercensalVariation = memoize(function(variable_name) {
            var values_2001 = this.getVariable(variable_name, 2001);
            var values_2010 = this.getVariable(variable_name, 2010);
            var rv = {};
            for (var dpto_id in values_2001) {
                rv[dpto_id] = (values_2010[dpto_id] / (values_2001[dpto_id] == 0 ? 1 : values_2001[dpto_id]) - 1).toPrecision(5) * 100;
            }
            return rv;
        });
    };


    var map_data;
    var distrito_info_dict = {};

    Handlebars.registerHelper('lower', function(str) {
        return str.toLowerCase();
    });
    Handlebars.registerHelper('mais_um', function(context) {
        return context + 1;
    });
    Handlebars.registerHelper('to_id', to_id);
    Handlebars.registerHelper('prec', function(n) { 
        if (n === undefined) return '-';
        return n % 1 === 0 ? n : n.toPrecision(4); 
    });

    Handlebars.registerHelper('display_number',
                             function(n) {
                                 n % 1 === 0 ? Math.round(n) : n;
                             });

    Handlebars.registerHelper('format_number', function(n) {
        
        if (n % 1=== 0) n = Math.round(n);
        else n = n.toPrecision(4);

        var number = n.toString();
        var dec = number.split('.')[1];

        number = number.split('.')[0];

        var result="", isNegative = false;
        
        if (number.indexOf("-")>-1){ number=number.substr(1); isNegative=true;}
        while (number.length > 3 ) {
            result = '.' + number.substr(number.length - 3) + result;
            number = number.substring(0, number.length - 3);
        }
        result = number + result;

        if(isNegative) result='-'+result;

        return result + (dec !== undefined ? ',' + dec : '');
    });


    var DISTRITO_INFO_TMPL = Handlebars.compile($('#distrito-info-template').html());
    var RANKING_TABLE_TMPL = Handlebars.compile($('#tabla-ranking-template').html());
    var tooltip_el = $('#tooltip');
    var ranking_tbody_el = $('#ranking tbody');

    // obtener datos de acuerdo al fragment (hash) del URL
    var interpretFragment = function(fragment, data_accessor) {
        var parts = fragment.substring(1).split('-');
        var var_name = parts[0], arg2 = parts[1], arg3 = parts[2];
        var total_var_name = var_name.split('_')[0] + '_Total';

        var rv = null;
        if (arg2 == 'intercensal') {
            rv = { 
                data: data_accessor.getIntercensalVariation(var_name),
                data_label: 'Variación intercensal',
                other_data: [
                    ['Censo 2001', data_accessor.getVariable(var_name, '2001')],
                    ['Censo 2010', data_accessor.getVariable(var_name, '2010')],
                ]
            };
        }
        else if (arg2 == 'ratio') {
            // ESTO ES UN HACK FEO.
            // Si estamos viendo proporcion de analfabetos,
            // calcular la proporcion sobre la poblacion mayor a 10 años
            if (var_name == 'Poblacion_Analfabetos') {
                total_var_name = 'Poblacion_Mayor10';
            }
            var d = data_accessor.getVariableAsRatio(var_name, arg3, total_var_name);
            rv = {
                data: data_accessor.getVariableAsRatio(var_name, arg3, total_var_name),
                other_data: [['Total', data_accessor.getVariable(var_name, arg3)]],
                data_label: 'Porcentaje'
            };
        }
        else {
            rv = { 
                data: data_accessor.getVariable(var_name, arg2) 
            };
        }
        return rv;
    };

    var filterRankingTable = function(provincia_id) {
        if (provincia_id) {
            $('#ranking tbody tr')
              .not('[data-provincia="'+provincia_id+'"]')
              .css('display', 'none');
            var prov_rows = $('#ranking tbody tr[data-provincia="'+provincia_id+'"] td:first-child');
            $.each(prov_rows, function(i, pr) {
                $('span:first-child', pr).css('display', 'none');
                $('span:nth-child(2)', pr).html(i+1);
            });
        }
        else {
            var trs = $('#ranking tbody tr');
            trs.css('display', 'table-row');
            $('td:first-child span:first-child', trs).css('display', 'inline');
            $('td:first-child span:nth-child(2)', trs).html('');
        }

    };

    var setActiveMapContainer = function() {
        if (location.hash.indexOf('intercensal') !== -1) {
            $('#variaciones #variacion').trigger('click');
        }
        else if (location.hash.indexOf('2001') !== -1) {
            $('#variaciones #censo_2001').trigger('click');
        }
        else if (location.hash.indexOf('2010') !== -1) {
            $('#variaciones #censo_2010').trigger('click');
        }
    };



    $(window).hashchange( function(){
        if (location.hash.indexOf('#') !== 0) return;

        // dibujar el mapa
        var data;

        if (data = interpretFragment(location.hash, map_data)) {
            mapa.drawMap(data.data, 5, 'jenks');

            // setear clase del mapa segun unidad de relevamiento
            var m = location.hash.match(/^#(Viviendas|Poblacion|Hogares)/);
            if (m.length == 2) 
                $('body').attr('class', m[1]);

            // setear 'active' en el boton correspondiente
            $('.variables li.active').removeClass('active');
            $('.variables a[href="'+ location.hash +'"]').parent().addClass('active');

            // setear el título
            var a = $('a[href="'+location.hash+'"]')
            var t = a.attr('title').split('—');
            t = '<strong>' + t[0] + '</strong> — ' + t[1];
            $('nav h2, #ranking thead tr:first-child th').html(t);
            
            
            var units = a.data('units') || '%';

            $('#legend-units').html(units);

            var units_long = a.data('units-long') || 'en porcentaje';
            $('#ranking thead tr:nth-child(2) th span:nth-child(2)').html('(' + units_long + ')');

            // actualizar la tabla de ranking
            // TODO optimizar.
            for (var k in data.data) {
                if (!distrito_info_dict[k]) continue;
                distrito_info_dict[k].data = data.data[k];
                if (data.other_data) {
                    distrito_info_dict[k].other_data = data.other_data.map(function(od) { 
                        return [od[0], od[1][k]]; 
                    });
                }
                distrito_info_dict[k].data_label = data.data_label;
            }

            ranking_tbody_el.html(RANKING_TABLE_TMPL({
                units: units == '%' ? '%' : '',
                data: d3.entries(distrito_info_dict).sort(function(a,b) {
                    return a.value.data - b.value.data;
                })
            }));

            filterRankingTable(mapa.zoomedTo);
        }
        $("tbody.scrollContent").scrollTop(0); // reset scroll ranking
    });


    showDistritoTooltip = function(distrito_path) {
        // busco el puesto del ranking en la tabla
        var d = {
            rank: $('tr[data-id='+distrito_path.id+'] td:first-child span:first-child', ranking_tbody_el).html(),
            data: distrito_info_dict[distrito_path.id].data,
            other_data: distrito_info_dict[distrito_path.id].other_data,
            data_label: distrito_info_dict[distrito_path.id].data_label
        };

        tooltip_el
            .html(DISTRITO_INFO_TMPL(Object.extend(d,
                                                   distrito_path.__data__.properties)))
            .css('visibility', 'visible');
    };

    hideDistritoTooltip = function() { tooltip_el.css('visibility', 'hidden'); };

    $(document).on({
        mouseenter: function() {
            var p = $('path#' + $(this).data('id'));
            if (p.length) showDistritoTooltip(p[0]);
        },
        mouseleave: hideDistritoTooltip
    }, '#ranking tbody tr');


    var zoomOut = function() {
        if (!mapa.zoomedTo) return;
        mapa.zoomToProvincia(null);
        filterRankingTable(null);
        $('#volver').css('visibility', 'hidden');
        $('#ranking thead tr:nth-child(2) th span:first-child')
            .html('Ranking de todo el país');
    };




    // cargar geometrias
    $.getJSON('data/ea.json', function(topojson) {
        mapa.drawPaths(topojson, 'article#svg');
        var tootip = new moverObjMouseOver($("path, #ranking"), $("#tooltip"), $("svg"));

        // llenar distrito_info_dict (convenience)
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
        // loader.mostrar();
        $.getJSON('data/data.json',
              function(data) {
                  map_data = new DataAccessor(data);

                  if (location.hash == '') location.hash = '#Poblacion_Total-intercensal';
                  else $(window).trigger('hashchange');

                  var m = location.hash.match(/^#(Viviendas|Poblacion|Hogares)/);

                  // disparo click sobre los tabs correspondientes en carga inicial
                  if (m.length == 2) {
                      $('#filtros h3:contains('+m[1]+')').parent().trigger('click')
                  }

                  setActiveMapContainer();

                  // loader..
                  loader.destruir();

                  $('#volver').on('click', function(e) {
                      e.preventDefault();
                      zoomOut();
                  });

                  $('g.mapa g.departamentos g').on('click', function(e) {
                      var id = $(this).attr('id');
                      if ((mapa.zoomedTo == 'gran-buenos-aires') || (mapa.zoomedTo && id.indexOf('gran-buenos-aires') !== 0)) { 
                          zoomOut(); 
                          return; 
                      }
                      if (id.indexOf('gran-buenos-aires') != 0) {
                          id = id.split(/provincia-(.+)/)[1];
                      }
                      else {
                          e.stopPropagation();
                      }
                      mapa.zoomToProvincia(id, function() { 
                          console.log(id);
                          filterRankingTable(id == 'gran-buenos-aires' ? 'buenos-aires' : id);
                          $('#ranking thead tr:nth-child(2) th span:first-child')
                              .html('Ranking de ' + $('#ranking tbody tr[data-provincia="'+id+'"] td:nth-child(2) span').html());

                          $('#volver').css('visibility', 'visible');
                      });
                  });
              });
    });
});
