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
            .domain(d3.extent(column.values))
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

    function enterOverlayPanels(filters, panelSizeX, render) {

        var c = config
        var cc = controlConfig
        //debugger


        var svg = d3.select(root).selectAll('.parcoordsSVG')
            .data([model], keyFun)

        svg.enter()
            .append('svg')
            .classed('parcoordsSVG', true)
            .attr('overflow', 'visible')
            .attr('width', width)
            .attr('height', height)
            .style('position', 'absolute')
            .style('padding', '32px')
/*
            .style('padding-top', resizeHeight)
            .style('padding-bottom', resizeHeight)
            .style('padding-left', brushCaptureWidth / 2)
            .style('padding-right', brushCaptureWidth / 2)
*/
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
            .attr('height', height);

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
            .attr('fill', function() {return 'rgba(0,255,0,' + 0.2 * Math.random() + ')';});

        var axisBrush = panel.selectAll('.axisBrush')
            .data(repeat, keyFun);

        var axisBrushEnter = axisBrush.enter()
            .append('g')
            .classed('axisBrush', true)
            .each(function(d) {
                var brush = d3.svg.brush()
                    .y(d.scale);
                brush
                    .on('brushstart', moved(brush, 0))
                    .on('brush', moved(brush, 1))
                    .on('brushend', moved(brush, 2));
                d3.select(this).call(brush);
            });

        axisBrushEnter
            .selectAll('rect')
            .attr('x', -brushCaptureWidth / 2)
            .attr('width', brushCaptureWidth)

        axisBrushEnter
            .selectAll('rect.extent')
            .attr('fill-opacity', 0.15)
            .attr('fill', 'url(#filterBarPattern)');

        axisBrushEnter
            .selectAll('.resize rect')
            .attr('height', resizeHeight);

        axisBrushEnter
            .selectAll('.resize.n rect')
            .attr('y', -resizeHeight);

        function moved(brush, startMoveEndIndex) {
            var operation = ['start', 'move', 'end'][startMoveEndIndex];
            return function(variable) {
                console.log('changed due to ', operation, variable.xIndex, variable.name, brush.extent())
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