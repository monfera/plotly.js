var controlConfig = require('./overlayConfig');
var utils = require('./utils');
var d3 = require('d3');

function keyFun(d) {
    return d && d.key;
}

function repeat(d) {
    return [d];
}

function descend(d) {
    return d;
}

module.exports = function (root, typedArrayModel, config) {

    var width = config.width
    var height = config.height
    var panelSizeX = config.panelSizeX
    var panelSizeY = config.panelSizeY

    var resizeHeight = controlConfig.filterSize;
    var brushVisibleWidth = controlConfig.filterSize;
    var brushCaptureWidth = 3 * controlConfig.filterSize;

    var columns = [];
    for(var i = 0; i < typedArrayModel.variableCount; i++) {
        var values = [];
        for(var j = 0; j < typedArrayModel.sampleCount; j++) {
            values.push(typedArrayModel.data.get(i, j));
        }
        columns.push({
            name: 'Gensym-' + i,
            values: values
        });
    }

    function makeScale(column) {
        return d3.scale.linear()
            //.domain(d3.extent(column.values))
            .range([height, 0]);
    }

    function makeScales(columns) {
        return columns.map(makeScale);
    }

    function viewModel(model) {
        return [{
            key: model.key,
            columns: model.columns,
            scales: makeScales(model.columns)
        }];
    }

    function panelViewModel(viewModel) {
        return columns.map(function(column, i) {
            var panelWidth = width / viewModel.columns.length;
            return {
                key: viewModel.columns[i].name,
                name: viewModel.columns[i].name,
                xIndex: i,
                x: panelWidth * i,
                width: panelWidth,
                height: height,
                values: viewModel.columns[i].values,
                scale: viewModel.scales[i]
            };
        });
    }


    var model = {
        key: 0,
        columns: columns
    }

    function enterOverlayPanels(filters, render) {

        var svg = d3.select(root).selectAll('.parcoordsSVG')
            .data([model], keyFun)

        svg.enter()
            .append('svg')
            .classed('parcoordsSVG', true)
            .attr('overflow', 'visible')
            .attr('width', width)
            .attr('height', height)
            .style('position', 'absolute')
            .style('padding', config.padding + 'px')
            .style('overflow', 'visible');

        var defs = svg.selectAll('defs')
            .data(repeat, keyFun);

        defs.enter()
            .append('defs');

        var filterBarPattern = defs.selectAll('#filterBarPattern')
            .data(repeat, keyFun);

        filterBarPattern.enter()
            .append('pattern')
            .attr('id', 'filterBarPattern')
            .attr('width', brushCaptureWidth)
            .attr('height', height)
            .attr('x', -brushVisibleWidth / 2)
            .attr('patternUnits', 'userSpaceOnUse');

        var filterBarPatternGlyph = filterBarPattern.selectAll('rect')
            .data(repeat, keyFun);

        filterBarPatternGlyph.enter()
            .append('rect')
            .attr('width', brushVisibleWidth)
            .attr('height', height)
            .attr('fill', controlConfig.filterColor);

        var parcoordsModel = svg.selectAll('.parcoordsModel')
            .data(repeat, keyFun)

        parcoordsModel.enter()
            .append('g')
            .classed('parcoordsModel', true);

        var parcoordsViewModel = parcoordsModel.selectAll('.parcoordsViewModel')
            .data(viewModel, keyFun)

        parcoordsViewModel.enter()
            .append('g')
            .classed('parcoordsViewModel', true);

        var parcoordsView = parcoordsViewModel.selectAll('.parcoordsView')
            .data(repeat, keyFun);

        parcoordsView.enter()
            .append('g')
            .classed('parcoordsView', true)

        var panel = parcoordsView.selectAll('.panel')
            .data(panelViewModel, keyFun)

        panel.enter()
            .append('g')
            .classed('panel', true)
            .attr('transform', function(d) {return 'translate(' + d.x + ', 0)';});

        var panelBackground = panel.selectAll('.panelBackground')
            .data(repeat, keyFun);

        panelBackground.enter()
            .append('rect')
            .classed('panelBackground', true)
            .attr('width', function(d) {return d.width})
            .attr('height', function(d) {return d.height})
            .attr('stroke', controlConfig.panelBorderColor)
            .attr('stroke-opacity', controlConfig.panelBorderOpacity)
            .attr('fill', function() {return 'rgba(0,255,0,' + controlConfig.panelOpacity * Math.random() + ')';});

        var axisBrush = panel.selectAll('.axisBrush')
            .data(repeat, keyFun);

        var axisBrushEnter = axisBrush.enter()
            .append('g')
            .classed('axisBrush', true)
            .each(function(d) {
                var brush = d3.svg.brush()
                    .y(d.scale);
                brush
                    .on('brush', moved(brush));
                d3.select(this).call(brush);
            });

        axisBrushEnter
            .selectAll('rect')
            .attr('x', -brushCaptureWidth / 2)
            .attr('width', brushCaptureWidth)
            .attr('stroke', controlConfig.captureZoneBorderColor);

        axisBrushEnter
            .selectAll('rect.extent')
            .attr('fill-opacity', controlConfig.filterBarOpacity)
            .attr('fill', 'url(#filterBarPattern)')
            .attr('y', -100); // small D3 bug workaround

        axisBrushEnter
            .selectAll('.resize rect')
            .attr('height', resizeHeight)
            .attr('fill-opacity', controlConfig.handleGlyphOpacity)
            .style('visibility', 'visible');

        axisBrushEnter
            .selectAll('.resize.n rect')
            .attr('y', -resizeHeight + controlConfig.handleGlyphOverlap);

        axisBrushEnter
            .selectAll('.resize.s rect')
            .attr('y', -controlConfig.handleGlyphOverlap);

        function moved(brush) {
            return function(variable) {
                console.log('moved haha')
                var filter = filters[variable.xIndex];
                var extent = brush.extent();
                var reset = extent[0] == extent[1]
                if(reset) {
                    brush.clear();
                    d3.select(this).select('rect.extent').attr('y', -100); // small D3 bug workaround
                }
                filter[0] = reset ? 0 : extent[0];
                filter[1] = reset ? 1 : extent[1];
                render(true); // fixme unthrottled rn!
            }
        }
    }

    function destroy() {
        var range = document.createRange()
        range.selectNodeContents(svg)
        range.deleteContents()
    }

    return {
        enterOverlayPanels: enterOverlayPanels,
        destroy: destroy
    }
}