Object.extend = function(destination, source) {
    var property;
    for (property in source) {
        if (source.hasOwnProperty(property)) {
            destination[property] = source[property];
        }
    }
    return destination;
};

(function(t) {

    var mapa = {};
    t.mapa = mapa;

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

    var DISTRITO_INFO_TMPL;
    var currentVariable;
    var currentDataDict;

    var showDistritoInfo = function(d) {
        var di = d3.select('#distrito-info');
        di.html(
            DISTRITO_INFO_TMPL(Object.extend(
                {
                    variable_name: currentVariable,
                    variable_value: currentDataDict[d.id]
                },
                d.properties)));
        di.style('visibility', 'visible');
    };

    var hideDistritoInfo = function(d) {
        var di = d3.select('#distrito-info');
        di.style('visibility', 'hidden');
    };


    var projection = d3.geo.mercator()
        .scale(7000)
        .center([-64,-32])
        .translate([190,230]);

    var path = d3.geo.path().projection(projection);

    var drawLegend = function(quantile, min, max, precision) {

        // TODO Esto esta roto para cuando quantile == d3.quantile
        // arreglarlo

        mapa.legend.selectAll('rect, text').remove();
        var precision = precision === undefined ? 2 : precision;

        var n_classes = quantile.range().length;
        var domain = quantile.domain();
        var data = [[min, domain[0] - Math.pow(10, -precision), 'q0' + '-' + n_classes]];

        d3.range(n_classes - 2).forEach(function(i) {
            data.push([domain[i],
                       domain[i+1] - Math.pow(10, -precision),
                       'q' + (i+1) + '-' + n_classes]);
        });

        data.push([domain[domain.length - 1],
                   max,
                   'q' + (n_classes-1) + '-' + n_classes]);

        mapa.legend.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('y', function(d, i) { return 15 * i; })
            .attr('width', 20)
            .attr('height', 10)
            .attr('class', function(d) { return d[2]; })
            .attr('data-start', function(d) { return d[0].toFixed(precision); })
            .attr('data-end', function(d) { return d[1].toFixed(precision); });

        mapa.legend.selectAll('text')
            .data(data)
            .enter()
            .append('text')
            .attr('y', function(d,i) { return 10 + 15 * i;})
            .attr('x', 30)
            .text(function(d, i) { return d[0].toFixed(precision) + ' — ' + d[1].toFixed(precision); });

    };

    // Dibujar el mapa
    mapa.drawMap = function(values, n_classes) {
        // buscar maximo y minimo valor
        var values_array = d3.entries(values)
                              .map(function(v) {
                                  return parseFloat(v.value);
                              })
                              .filter(function(v) { return !isNaN(v);})
                              .sort(d3.ascending);

        // Quantiles
        // var quantile = d3.scale.quantile()
        //                  .domain(values_array)
        //                  .range(d3.range(n_classes));

        // head Tail Thresholds
        var htt = headTailThresholds(values_array, n_classes-1);
        var quantile = d3.scale.threshold()
            .domain(htt)
            .range(d3.range(n_classes));

        // jenks optimization

        // var j = jenks(values_array, n_classes);

        // var quantile = d3.scale.threshold()
        //     .domain(j.slice(1, j.length - 1))
        //     .range(d3.range(n_classes));


        // console.log('max', values_array[values_array.length - 1]);
        // console.log('min', values_array[0]);

        drawLegend(quantile,
                    values_array[0],
                    values_array[values_array.length - 1]);

        // pintar el mapa
        mapa.departamentos
            .selectAll('path')
            .attr('class', function(d) { return 'q' + quantile(values[d.id]) + '-' + n_classes; });

    };

    mapa.drawPaths = function(topology, container_element_selector) {

        var svg = d3.select(container_element_selector).append("svg")
            .attr("width", mapa.width)
            .attr("height", mapa.height)


            .attr("class", "Poblacion");

        mapa.mapa_svg = svg.append('g').classed('mapa', true);
        mapa.departamentos = mapa.mapa_svg.append('g').attr('class', 'departamentos');
        mapa.provincias =  mapa.mapa_svg.append('g').attr('class', 'provincias');
        mapa.legend = svg.append('g').attr('class', 'legend').attr('transform', 'translate(250, 500)');



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

        provincias_geometries.forEach(function(pg) {
            var p_id = to_id(pg.properties.PROVINCIA);
            mapa.departamentos
                .append('g')
                .attr('id', 'provincia-' + p_id)
                .selectAll('path')
                .data(departamentos_geometries.filter(function(d) {
                    return p_id === to_id(d.properties.p);
                }))
                .enter()
                .append('path')
                .attr('id', function(d) { return d.id })
                .attr('d', path)
                .attr('class', 'departamento')
                .on('mouseover', function(d) { console.log(d.properties.a); });
        });
    };


    // onChange handler for select
    /*
      d3.select('select#variable').on('change', function() {
      var o = $('select#variable option[value=' + $('select#variable').val() + ']');
      currentVariable = this.value;
      console.log(o.data());
      if (o.data('relative')) {
      var relative_to = $('select#variable option[value=' + $('select#variable').val() + ']').data('relative');
      var values = ftclient.getVariableRatio(currentVariable,
      relative_to,
      function(values) { drawMap(values, 5); });
      drawMap(values,

      relative_to);
      }
      else if (o.data('variation')) {
      var total = o.data('total')
      drawMap(ftclient.getIntercensalRatioVariation(currentVariable + '_2010',
      total + '_2010',
      currentVariable + '_2001',
      total + '_2001',
      function(values) { drawMap(values, 5); }));
      }
      else {
      drawMap(ftclient.getVariable(currentVariable,
      function(values) { drawMap(values, 5); }));

      }
      }); */

    mapa.zoomToProvincia = function(v) {
        var p_tr = projection.translate();
        var k, x, y;
        if (v ===  null) {
            k = 1;
            x = -p_tr[0]; y = -p_tr[1];
            mapa.mapa_svg.selectAll('g.departamentos g').classed('inactive', false);
            mapa.mapa_svg.selectAll('g.provincias path').style('stroke-width', '2px');
            mapa.mapa_svg.selectAll('g.departamentos path').style('stroke-width', '1px');

            mapa.mapa_svg.transition().duration(750).attr('transform', '');
            mapa.zoomedTo = null;
        }
        else {
            var p = d3.select('.provincias path#' + to_id(v));

            mapa.mapa_svg.selectAll('g.departamentos g').classed('inactive', false);
            var b = path.bounds(p[0][0].__data__);
            k = .95 / Math.max((b[1][0] - b[0][0]) / mapa.width, (b[1][1] - b[0][1]) / mapa.height);
            mapa.mapa_svg
                .transition()
                .duration(750)
                .attr("transform",
                      "translate(" + projection.translate() + ")"
                      + "scale(" + .95 / Math.max((b[1][0] - b[0][0]) / mapa.width, (b[1][1] - b[0][1]) / mapa.height) + ")"
                      + "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");

            mapa.mapa_svg.selectAll('g.departamentos g:not(#provincia-' + to_id(v) + ')').classed('inactive', true);
//            mapa.mapa_svg.selectAll('g.provincias path').style('stroke-width', '0px');
            mapa.zoomedTo = to_id(v);
        }


    };

})(this);

/*
  $(function() {
  //    ;
  drawMap(d3.select('select#variable')[0][0].value);
  });
*/
