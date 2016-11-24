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

    var resizeHeight = controlConfig.handleGlyphHeight;
    var brushVisibleWidth = controlConfig.filterSize;
    var brushCaptureWidth = 3 * controlConfig.filterSize;

    var columns = [];
    for(var i = 0; i < typedArrayModel.variableCount; i++) {
        var values = [];
        for(var j = 0; j < typedArrayModel.sampleCount; j++) {
            values.push(typedArrayModel.data.get(i, j));
        }
        columns.push({
            name: typedArrayModel.variableNames[i],
            values: values
        });
    }

    function makeDomainScale(column) {
        return d3.scale.linear()
            .domain(d3.extent(column.values))
            .range([height, 0]);
    }

    function makeUnitScale(column) {
        return d3.scale.linear()
            .range([height, 0]);
    }

    function viewModel(model) {
        return [{
            key: model.key,
            columns: model.columns,
            unitScales: columns.map(makeUnitScale),
            domainScales: columns.map(makeDomainScale)
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
                unitScale: viewModel.unitScales[i],
                domainScale: viewModel.domainScales[i],
                columns: columns
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
            .style('overflow', 'visible')
            .style('shape-rendering', 'crispEdges');

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
            .attr('x', -brushVisibleWidth)
            .attr('patternUnits', 'userSpaceOnUse');

        var filterBarPatternGlyph = filterBarPattern.selectAll('rect')
            .data(repeat, keyFun);

        filterBarPatternGlyph.enter()
            .append('rect')
            .attr('shape-rendering', 'geometricPrecision')
            .attr('width', brushVisibleWidth)
            .attr('height', height)
            .attr('x', brushVisibleWidth / 2)
            .attr('fill', controlConfig.filterColor)
            .attr('fill-opacity', controlConfig.filterBarOpacity)
            .attr('stroke', controlConfig.filterBarStroke)
            .attr('stroke-width', controlConfig.filterBarStrokeWidth);

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

        var brushing = false

        panel.enter()
            .append('g')
            .classed('panel', true)
            .attr('transform', function(d) {return 'translate(' + d.x + ', 0)';})
            .call(d3.behavior.drag()
                .origin(function(d) {return d;})
                .on('drag', function(d) {
                    if(brushing)
                        return;
                    d.x = d3.event.x;
                    d3.select(this).attr('transform', 'translate(' + d.x + ', 0)');
                })
            );

        var panelBackground = panel.selectAll('.panelBackground')
            .data(repeat, keyFun);

        panelBackground.enter()
            .append('rect')
            .classed('panelBackground', true)
            .style('pointer-events', 'none')
            .attr('width', function(d) {return d.width})
            .attr('height', function(d) {return d.height})
            .attr('stroke', controlConfig.panelBorderColor)
            .attr('stroke-opacity', controlConfig.panelBorderOpacity)
            .attr('fill', function() {return 'rgba(0,255,0,' + controlConfig.panelOpacity * Math.random() + ')';});

        var axisOverlays = panel.selectAll('.axisOverlays')
            .data(repeat, keyFun);

        axisOverlays.enter()
            .append('g')
            .classed('axisOverlays', true);

        var axis = axisOverlays.selectAll('.axis')
            .data(repeat, keyFun);

        var axisEnter = axis.enter()
            .append('g')
            .classed('axis', true)
            .each(function(d) {
                d3.select(this)
                    .call(d3.svg.axis()
                        .orient('left')
                        .ticks(height / 50, '3s')
                        .scale(d.domainScale));
            });

        axisEnter
            .selectAll('.domain, .tick')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-opacity', 0.5)
            .attr('stroke-width', '0.5px');

        axisEnter
            .selectAll('text')
            .style('font-family', 'monospace')
            .style('font-weight', 100)
            .style('font-size', 'x-small')
            .style('fill', 'black')
            .style('fill-opacity', 1)
            .style('text-shadow', '2px 2px 2px #fff, -2px -2px 2px #fff, 2px -2px 2px #fff, -2px 2px 2px #fff')
            .style('cursor', 'default')
            .style('user-select', 'none');

        var axisHeading = axisOverlays.selectAll('.axisHeading')
            .data(repeat, keyFun);

        axisHeading.enter()
            .append('g')
            .classed('axisHeading', true)

        var axisTitle = axisHeading.selectAll('.axisTitle')
            .data(repeat, keyFun);

        axisTitle.enter()
            .append('text')
            .classed('axisTitle', true)
            .text(function(d) {return d.name;})
            .attr('y', -controlConfig.handleGlyphHeight - 10)
            .attr('text-anchor', 'middle')
            .style('font-family', 'sans-serif')
            .style('font-size', 'xx-small')
            .style('cursor', 'default')
            .style('user-select', 'none');

        var axisBrush = axisOverlays.selectAll('.axisBrush')
            .data(repeat, keyFun);

        var axisBrushEnter = axisBrush.enter()
            .append('g')
            .classed('axisBrush', true)
            .each(function(d) {
                d.brush = d3.svg.brush()
                    .y(d.unitScale)
                    .on('brushstart', started)
                    .on('brush', moved)
                    .on('brushend', ended);
                d3.select(this).call(d.brush);
            });

        axisBrushEnter
            .selectAll('rect')
            .attr('x', -brushCaptureWidth / 2)
            .attr('width', brushCaptureWidth)
            .attr('stroke', controlConfig.captureZoneBorderColor);

        axisBrushEnter
            .selectAll('rect.extent')
            .attr('fill', 'url(#filterBarPattern)')
            .attr('y', -100); //  // zero-size rectangle pointer issue workaround

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

        var justStarted = false;

        function started() {
            justStarted = true;
            brushing = true;
        }

        function moved(variable) {
            var extent = variable.brush.extent();
            var reset = justStarted && (extent[0] == extent[1]);
            if(reset) {
                variable.brush.clear();
                d3.select(this).select('rect.extent').attr('y', -100); // zero-size rectangle pointer issue workaround
            }
            filters[variable.xIndex] = reset ? [0, 1] : extent.slice();
            justStarted = false;
            render(true);
        }

        function ended() {
            brushing = false;
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