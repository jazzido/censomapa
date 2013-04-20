(function(t) {

    var mapa = {};
    t.mapa = mapa;

    var AMBA_IDS = ['D02003','D02004','D02011','D02017','D02035','D02036','D02132','D02038','D02051','D02052','D02134','D02133','D02129','D02061','D02063','D02062','D02070','D02130','D02075','D02077','D02079','D02080','D02089','D02128','D02092','D02105','D02106','D02053','D02109','D02113','D02118','D02122','CAPFED'];
    mapa.AMBA_IDS = AMBA_IDS;

    // TODO hacer que esto sea configurable
    mapa.width = 400;
    mapa.height = 950;

    // implementacion de 'Head/Tail breaks'
    // http://arxiv.org/pdf/1209.2801v1.pdf
    var headTailThresholds = function(data, n_classes, left) {
        data = data.sort(d3.ascending);
        var m = d3.mean(data), rv = [m];

        var slice = function(data) {
            if (left) {
                return data.slice(0, d3.bisectLeft(data, m));
            }
            else {
                return data.slice(d3.bisectRight(data, m), data.length);
            }
        };

        data = slice(data);
        while (n_classes > 1) {
            m = d3.mean(data);
            rv.push(m);
            data = slice(data);
            n_classes--;
        }
        return rv.sort(d3.ascending);
    };

    var to_id = function(str) {
        return str.replace(/\s+/g, '-').toLowerCase();
    };

    var projection = d3.geo.mercator()
        .scale(7000)
        .center([-65,-38])
        .translate([mapa.width / 2 - 30 , mapa.height / 2 - 100]);

    mapa.projection = projection;

    var path = d3.geo.path().projection(projection);

    var drawLegend = function(thresholds, min, max, n_negative_classes, precision) {

        // TODO Esto esta roto para cuando quantile == d3.quantile
        // arreglarlo

        var rangeClassName = function(i) {
            return 'q' + i + '-' + n_classes + '-' + n_negative_classes + 'n'
        };

        mapa.legend.selectAll('rect, text').remove();
        var precision = precision === undefined ? 2 : precision;

        var n_classes = thresholds.range().length;
        var domain = thresholds.domain();

        var data = [[min, domain[0] - Math.pow(10, -precision), rangeClassName(0)]];
        d3.range(n_classes - 2).forEach(function(i) {
            data.push([domain[i],
                       domain[i+1] - Math.pow(10, -precision),
                       rangeClassName(i+1)]);
        });
        data.push([domain[domain.length - 1],
                   max,
                   rangeClassName(n_classes-1)]);

        var legend_element_width = mapa.width / n_classes;
        mapa.legend.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', function(d, i) { return legend_element_width * i; })
            .attr('width', legend_element_width)
            .attr('height', 10)
            .attr('class', function(d) { return d[2]; })
            .attr('data-start', function(d) { return d[0].toFixed(precision); })
            .attr('data-end', function(d) { return d[1].toFixed(precision); });

        mapa.legend.selectAll('text')
            .data(data)
            .enter()
            .append('text')
            .attr('y', 22)
            .attr('x', function(d, i) { return legend_element_width * i; })
            .text(function(d, i) { 
                return d[0] % 1 === 0 ? Math.round(d[0]) : d[0].toFixed(precision);
            });

        mapa.legend
            .append('text')
            .attr('y', 22)
            .attr('x', legend_element_width * n_classes)
            .text(data[data.length - 1][1] % 1 === 0 ? Math.round(data[data.length -1][1]) : data[data.length - 1][1].toFixed(precision));

        mapa.legend.selectAll('text')
        .attr('x', function(d,i) { 
            if (i == n_classes) return this.getAttribute('x') - this.getBBox().width + 1;
            else if (i != 0) return this.getAttribute('x') - this.getBBox().width / 2;
            else return this.getAttribute('x');
        });
        

    };

    // Dibujar el mapa
    mapa.drawMap = function(values, n_classes, breaks_method) {

        //  metodo bastante burdo para forzar un 'quiebre' en cero
        var fixNegativeBreaks = function(breaks) {
            var n_classes = breaks.length;
            for(var i = 1; i < breaks.length; i++) {
                if (breaks[i] >= 0 && breaks[i-1] < 0)
                    breaks.splice(i, 1, 0);
            }
            return breaks;
        };

        // buscar maximo y minimo valor
        var values_array = d3.entries(values)
            .map(function(v) {
                return parseFloat(v.value);
            })
            .filter(function(v) { return !isNaN(v);})
            .sort(d3.ascending);

        var fixed, htt;

        if (breaks_method === undefined)
            breaks_method = 'jenks';

        switch (breaks_method) {
            // jenks optimization is default
            case undefined:
            case 'jenks':
            var j = jenks(values_array, n_classes);
            fixed = fixNegativeBreaks(j);
            break;
            case 'htt':
            case 'htt-left':
            htt = headTailThresholds(values_array, n_classes-1, breaks_method == 'htt-left');
            fixed = fixNegativeBreaks([values_array[0]].concat(htt).concat([values_array[values_array.length - 1]]));
            break;
            case 'quantiles':
            var quant_thresholds = d3.scale.quantile()
                                           .domain(values_array)
                                           .range(d3.range(n_classes))
                                           .quantiles();
            fixed = [values_array[0]].concat(quant_thresholds).concat([values_array[values_array.length - 1]]);
            break;
            default:
            // parse argument
            var manual_thresholds = $.grep(breaks_method.split(/(-?\d+\.?\d*)/), 
                                           function(v,i) { 
                                               return i % 2 == 1; 
                                           }).map(parseFloat);
            if (manual_thresholds.length == 0 || manual_thresholds.length != n_classes - 1)
                break;
            fixed = [values_array[0]].concat(manual_thresholds).concat([values_array[values_array.length - 1]]);
        }

        var n_negative_classes = 0;
        fixed.forEach(function(v) { if (v < 0) n_negative_classes++; });

        var thresholds = d3.scale.threshold()
            .domain(fixed.splice(1,4))
            .range(d3.range(n_classes));

        drawLegend(thresholds,
                   values_array[0],
                   values_array[values_array.length - 1],
                   n_negative_classes);

        // pintar el mapa
        mapa.departamentos
            .selectAll('path, g.path')
            .attr('class', function(d) { 
                return 'q' + thresholds(values[d.id]) + '-' + n_classes + '-' + n_negative_classes + 'n'; 
            });

    };

    mapa.drawPaths = function(topology, container_element_selector) {

        var svg = d3.select(container_element_selector).append("svg")
            .attr("width", mapa.width)
            .attr("height", mapa.height)
            .attr("class", "Poblacion");

        mapa.mapa_svg = svg.append('g').classed('mapa', true).attr('transform', 'translate(0, 20)');
        mapa.departamentos = mapa.mapa_svg.append('g').attr('class', 'departamentos');
        mapa.provincias =  mapa.mapa_svg.append('g').attr('class', 'provincias');
        mapa.legend = svg.append('g').attr('class', 'legend');

        var provincias_geometries = topojson.object(topology, topology.objects.provincias).geometries;
        var departamentos_geometries =  topojson.object(topology, topology.objects.departamentos).geometries;

        mapa.provincias
            .selectAll('path')
            .data(provincias_geometries)
            .enter()
            .append('path')
            .attr('id', function(d) { return to_id(d.properties.PROVINCIA); })
            .attr('d', path)
            .attr('class', 'provincia');

        mapa.provincias
            

        mapa.gran_buenos_aires = mapa.departamentos.append('g').attr('class', 'gran-buenos-aires');
        mapa.gran_buenos_aires_mesh = topojson.mesh(topology, 
                                                    {type: 'GeometryCollection',
                                                     geometries: topology.objects.departamentos.geometries.filter(function(g) {
                                                         return AMBA_IDS.indexOf(g.id) !== -1; 
                                                     })});

        provincias_geometries.forEach(function(pg) {
            var p_id = to_id(pg.properties.PROVINCIA);
            mapa.departamentos
                .append('g')
                .attr('id', 'provincia-' + p_id)
                .selectAll('path')
                .data(departamentos_geometries.filter(function(d) {
                    return p_id === to_id(d.properties.p_id) && AMBA_IDS.indexOf(d.id) == -1;
                }))
                .enter()
                .append('path')
                .attr('id', function(d) { return d.id })
                .attr('d', path)
                .attr('class', 'departamento');
        });

        mapa.departamentos
            .select('g#provincia-buenos-aires')
            .append('g')
            .attr('id', 'gran-buenos-aires')
            .selectAll('path')
            .data(departamentos_geometries.filter(function(d) {
                return AMBA_IDS.indexOf(d.id) !== -1
            }))
            .enter()
            .append('path')
            .attr('id', function(d) { return d.id })
            .attr('d', path)
            .attr('class', 'departamento');

    };

    mapa.zoomToProvincia = function(v, callback) {
        var p_tr = projection.translate();
        var k, x, y;
        if (v ===  null) {
            k = 1;
            x = -p_tr[0]; y = -p_tr[1];
            
            mapa.mapa_svg
                .transition()
                .duration(750)
                .attr('transform', 'translate(0,20)')
                .each('end', function() {
                    mapa.mapa_svg.selectAll('g.departamentos g').classed('inactive', false);
                    mapa.mapa_svg
                        .selectAll('g.provincias path')
                        .style('stroke-opacity',1)
                        .style('stroke-width', 2);

                    mapa.mapa_svg
                        .selectAll('g.departamentos path')
                        .style('stroke-width', '1px');

                    mapa.zoomedTo = null;

                    if (callback !== undefined) callback();
              
                });

        }
        else {
            mapa.mapa_svg.selectAll('g.departamentos g').classed('inactive', false);
            var b = path.bounds(v != 'gran-buenos-aires' ? d3.select('.provincias path#' + to_id(v))[0][0].__data__ : mapa.gran_buenos_aires_mesh);
            k = 1 / Math.max((b[1][0] - b[0][0]) / mapa.width, (b[1][1] - b[0][1]) / mapa.height);

            mapa.mapa_svg
                .selectAll('g.provincias path')
                .style('stroke-opacity', 0)
                .style('stroke-width', 0.1);

            mapa.mapa_svg
                .selectAll('g.departamentos path')
                .style('stroke-width', 1/k + 'px');


            mapa.mapa_svg
                .transition()
                .duration(750)
                .attr("transform",
                      "translate(" + (projection.translate()[0] + 30) + "," + (projection.translate()[1] + 100) + ")"
                      + "scale(" + k + ")"
                      + "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")")
                .each('end', function() {
                    mapa.mapa_svg.selectAll('g.departamentos > g:not(#provincia-' + to_id(v == 'gran-buenos-aires' ? 'buenos-aires' : v) + ')').classed('inactive', true);

                    mapa.zoomedTo = to_id(v);
                    if (callback !== undefined) callback();
                });

        }
    };

})(this);
