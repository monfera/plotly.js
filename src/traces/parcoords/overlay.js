var lineLayerMaker = require('./lineLayer');
var unitToColor = require('./colors');
var controlConfig = require('./controlConfig');
var utils = require('./utils');
var d3 = require('d3');

function keyFun(d) {
    return d && d.key;
}

function repeat(d) {
    return [d];
}

function makeDomainScale(height, column) {
    var lo = d3.min(column.values);
    var hi = d3.max(column.values);
    if(!column.integer && lo === hi) {
        lo *= 0.9;
        hi *= 1.1;
    }
    return column.integer
        ? d3.scale.ordinal()
        .domain(d3.range(Math.round(lo), Math.round(hi + 1)))
        .rangePoints([height - controlConfig.verticalPadding, controlConfig.verticalPadding], controlConfig.integerPadding)
        : d3.scale.linear()
        .domain([lo, hi])
        .range([height - controlConfig.verticalPadding, controlConfig.verticalPadding]);
}

function makeUnitScale(height) {
    return d3.scale.linear()
        .range([height - controlConfig.verticalPadding, controlConfig.verticalPadding]);
}

function makeIntegerScale(column) {
    return column.integer && d3.scale.ordinal()
            .domain(d3.range(0, Math.round(d3.max(column.values) + 1) - Math.round(d3.min(column.values))).map(function(d, _, a) {return d / (a.length - 1)}))
            .rangePoints([0, 1], controlConfig.integerPadding)
}

function viewModel(width, height, model) {

    var viewModel = {
        key: model.key,
        columns: model.columns,
        xScale: d3.scale.ordinal().domain(d3.range(model.columns.length)).rangePoints([0, width], 0),
        unitScales: model.columns.map(makeUnitScale.bind(0, height)),
        domainScales: model.columns.map(makeDomainScale.bind(0, height)),
        integerScales: model.columns.map(makeIntegerScale),
        filters: model.columns.map(function() {return [0, 1];})
    };

    viewModel.panels = viewModel.columns.map(function(column, i) {
        return {
            key: viewModel.columns[i].name,
            name: viewModel.columns[i].name,
            integer: viewModel.columns[i].integer,
            xIndex: i,
            originalXIndex: i,
            height: height,
            values: viewModel.columns[i].values,
            xScale: viewModel.xScale,
            x: viewModel.xScale(i),
            unitScale: viewModel.unitScales[i],
            domainScale: viewModel.domainScales[i],
            integerScale: viewModel.integerScales[i],
            filter: viewModel.filters[i],
            columns: viewModel.columns,
            parent: viewModel
        };
    })

    return [viewModel];
}

function styleExtentTexts(selection) {
    selection
        .classed('axisExtentText', true)
        .attr('text-anchor', 'middle')
        .style('font-family', 'monospace')
        .style('font-weight', 100)
        .style('font-size', 'x-small')
        .style('cursor', 'default')
        .style('user-select', 'none');
}

module.exports = function (root, typedArrayModel, config) {

    var width = config.width
    var height = config.height

    var resizeHeight = controlConfig.handleGlyphHeight;
    var brushVisibleWidth = controlConfig.filterVisibleWidth;
    var brushCaptureWidth = controlConfig.filterCaptureWidth;

    var columns = [];
    for(var i = 0; i < typedArrayModel.variableCount; i++) {
        var values = [];
        for(var j = 0; j < typedArrayModel.sampleCount; j++) {
            values.push(typedArrayModel.data.get(i, j));
        }
        columns.push({
            name: typedArrayModel.variableNames[i],
            integer: typedArrayModel.integer[i],
            values: values
        });
    }

    var model = {
        key: 0,
        columns: columns
    }

    function enterSvgDefs(root) {
        var defs = root.selectAll('defs')
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
            .attr('shape-rendering', 'crispEdges')
            .attr('width', brushVisibleWidth)
            .attr('height', height)
            .attr('x', brushVisibleWidth / 2)
            .attr('fill', controlConfig.filterBarFill)
            .attr('fill-opacity', controlConfig.filterBarFillOpacity)
            .attr('stroke', controlConfig.filterBarStroke)
            .attr('stroke-opacity', controlConfig.filterBarStrokeOpacity)
            .attr('stroke-width', controlConfig.filterBarStrokeWidth);
    }

    function enterOverlayPanels() {

        var lastApproached = null;

        var variableViews;

        var parcoordsModel = d3.select(root).selectAll('.parcoordsModel')
            .data([model], keyFun);

        parcoordsModel.enter()
            .append('div')
            .classed('parcoordsModel', true);

        var parcoordsViewModel = parcoordsModel.selectAll('.parcoordsViewModel')
            .data(viewModel.bind(0, width, height), keyFun)

        parcoordsViewModel.enter()
            .append('div')
            .classed('parcoordsViewModel', true);

        parcoordsViewModel
            .each(function(d) {
                variableViews = d.panels;
            });

        var parcoordsLineLayer = parcoordsViewModel.selectAll('.parcoordsLineLayer')
            .data(function(vm) {
                return [true, false].map(function(context) {
                    return {
                        key: context ? 'contextLineLayer' : 'focusLineLayer',
                        context: context,
                        viewModel: vm
                    };
                });
            }, keyFun);

        var temporary = [];

        parcoordsLineLayer.enter()
            .append('canvas')
            .classed('parcoordsLineLayer', true)
            .style('position', 'absolute')
            .style('padding', config.padding + 'px')
            .style('overflow', 'visible');

        parcoordsLineLayer
            .each(function(d) {
                d.viewModel[d.key] = lineLayerMaker(this, config, typedArrayModel, unitToColor, d.context);
                if(!d.context) {
                    d.viewModel[d.key].render(variableViews, true);
                }
            });

        var parcoordsControlOverlay = parcoordsViewModel.selectAll('.parcoordsControlOverlay')
            .data(repeat, keyFun);

        parcoordsControlOverlay.enter()
            .append('svg')
            .classed('parcoordsControlOverlay', true)
            .attr('overflow', 'visible')
            .attr('width', width)
            .attr('height', height)
            .style('position', 'absolute')
            .style('padding', config.padding + 'px')
            .style('overflow', 'visible')
            .style('shape-rendering', 'crispEdges')
            .call(enterSvgDefs);

        var parcoordsControlView = parcoordsControlOverlay.selectAll('.parcoordsControlView')
            .data(repeat, keyFun);

        parcoordsControlView.enter()
            .append('g')
            .classed('parcoordsControlView', true);

        var panel = parcoordsControlView.selectAll('.panel')
            .data(function(vm) {return vm.panels;}, keyFun)

        var domainBrushing = false
        var axisDragging = false

        function someFiltersActive(view) {
            return view.panels.some(function(p) {return p.filter[0] !== 0 || p.filter[1] !== 1;});
        }

        panel.enter()
            .append('g')
            .classed('panel', true)
            .attr('transform', function(d) {return 'translate(' + d.xScale(d.xIndex) + ', 0)';})

        panel
            .call(d3.behavior.drag()
                .origin(function(d) {return d;})
                .on('drag', function(d) {
                    if(domainBrushing)
                        return;
                    axisDragging = true;
                    d.x = Math.max(-10, Math.min(width + 10, d3.event.x));
                    panel
                        .sort(function(a, b) {return a.x - b.x;})
                        .each(function(dd, i) {
                            dd.xIndex = i;
                            dd.x = d == dd ? dd.x : dd.xScale(dd.xIndex);
                        });
                    panel.filter(function(dd) {return Math.abs(d.xIndex - dd.xIndex) !== 0;})
                        .attr('transform', function(d) {return 'translate(' + d.xScale(d.xIndex) + ', 0)';});
                    d3.select(this).attr('transform', 'translate(' + d.x + ', 0)');
                    panel.each(function(d, i) {variableViews[i] = d;});
                    d.parent['contextLineLayer'].render(d.parent.panels, false, !someFiltersActive(d.parent));
                    d.parent['focusLineLayer'].render(d.parent.panels);
                })
                .on('dragend', function(d) {
                    if(domainBrushing || !axisDragging) {
                        axisDragging = false;
                        return;
                    }
                    axisDragging = false;
                    d.x = d.xScale(d.xIndex);
                    d3.select(this)
                        .attr('transform', function(d) {return 'translate(' + d.x + ', 0)';});
                    d.parent['contextLineLayer'].render(d.parent.panels, false, !someFiltersActive(d.parent));
                    d.parent['focusLineLayer'].render(d.parent.panels);
                })
            );

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
                var wantedTickCount = height / controlConfig.averageTickDistance;
                var scale = d.domainScale;
                var dom = scale.domain();
                d3.select(this)
                    .call(d3.svg.axis()
                        .orient('left')
                        .tickSize(4)
                        .outerTickSize(2)
                        .ticks(wantedTickCount, '3s') // works for continuous scales only...
                        .tickValues(d.integer // and this works for ordinal scales
                            ? dom.filter(function(d, i) {return !(i % Math.round((dom.length / wantedTickCount)));})
                            : null)
                        .scale(scale));
            });

        axisEnter
            .selectAll('.domain, .tick')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-opacity', 0.25)
            .attr('stroke-width', '1px');

        axisEnter
            .selectAll('text')
            .style('font-family', 'monospace')
            .style('font-weight', 100)
            .style('font-size', 'x-small')
            .style('fill', 'black')
            .style('fill-opacity', 1)
            .style('stroke', 'none')
            .style('text-shadow', '1px 1px 1px #fff, -1px -1px 1px #fff, 1px -1px 1px #fff, -1px 1px 1px #fff')
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
            .attr('transform', 'translate(0,' + -(controlConfig.handleGlyphHeight + 20) + ')')
            .text(function(d) {return d.name;})
            .attr('text-anchor', 'middle')
            .style('font-family', 'sans-serif')
            .style('font-size', 'xx-small')
            .style('cursor', 'default')
            .style('user-select', 'none');

        var axisExtent = axisOverlays.selectAll('.axisExtent')
            .data(repeat, keyFun);

        axisExtent.enter()
            .append('g')
            .classed('axisExtent', true);

        var axisExtentTop = axisExtent.selectAll('.axisExtentTop')
            .data(repeat, keyFun);

        axisExtentTop.enter()
            .append('g')
            .classed('axisExtentTop', true)
            .attr('transform', 'translate(' + 0 + ',' + -(controlConfig.handleGlyphHeight - 2) + ')')

        var axisExtentTopText = axisExtentTop.selectAll('.axisExtentTopText')
            .data(repeat, keyFun);

        function formatExtreme(d) {
            return d.integer ? d3.format('.0s') : d3.format('.3s');
        }

        axisExtentTopText.enter()
            .append('text')
            .classed('axisExtentTopText', true)
            .text(function(d) {return formatExtreme(d)(d.domainScale.domain().slice(-1)[0]);})
            .attr('alignment-baseline', 'after-edge')
            .call(styleExtentTexts);

        var axisExtentBottom = axisExtent.selectAll('.axisExtentBottom')
            .data(repeat, keyFun);

        axisExtentBottom.enter()
            .append('g')
            .classed('axisExtentBottom', true)
            .attr('transform', 'translate(' + 0 + ',' + (height + controlConfig.handleGlyphHeight - 2) + ')')

        var axisExtentBottomText = axisExtentBottom.selectAll('.axisExtentBottomText')
            .data(repeat, keyFun);

        axisExtentBottomText.enter()
            .append('text')
            .classed('axisExtentBottomText', true)
            .text(function(d) {return formatExtreme(d)(d.domainScale.domain()[0]);})
            .attr('alignment-baseline', 'before-edge')
            .call(styleExtentTexts);

        var axisBrush = axisOverlays.selectAll('.axisBrush')
            .data(repeat, keyFun);

        var axisBrushEnter = axisBrush.enter()
            .append('g')
            .classed('axisBrush', true)
            .on('mouseenter', function approach(column) {
                if(column !== lastApproached && !axisDragging) {
                    column.parent['focusLineLayer'].approach(column);
                    lastApproached = column;
                }
            });

        axisBrush
            .each(function(d) {
                if(!d.brush) {
                    d.brush = d3.svg.brush()
                        .y(d.unitScale)
                        .on('brushstart', axisBrushStarted)
                        .on('brush', axisBrushMoved)
                        .on('brushend', axisBrushEnded);
                    d3.select(this).call(d.brush);
                }
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
        var contextShown = false;

        function axisBrushStarted() {
            justStarted = true;
            domainBrushing = true;
        }

        function axisBrushMoved(variable) {
            var extent = variable.brush.extent();
            var filter = variableViews[variable.xIndex].filter;
            var reset = justStarted && (extent[0] == extent[1]);
            if(reset) {
                variable.brush.clear();
                d3.select(this).select('rect.extent').attr('y', -100); // zero-size rectangle pointer issue workaround
            }
            var newExtent = reset ? [0, 1] : extent.slice();
            if(newExtent[0] !== filter[0] || newExtent[1] !== filter[1]) {
                if(variable.originalXIndex === 0) {
                    variable.parent['focusLineLayer'].setColorDomain(newExtent);
                }
                variableViews[variable.xIndex].filter = newExtent;
                variable.parent['focusLineLayer'].render(variableViews, true);
                var filtersActive = someFiltersActive(variable.parent);
                if(!contextShown && filtersActive) {
                    variable.parent['contextLineLayer'].render(variableViews, true);
                    contextShown = true;
                } else if(contextShown && !filtersActive) {
                    variable.parent['contextLineLayer'].render(variableViews, true, true);
                    contextShown = false;
                }
            }
            justStarted = false;
        }

        function axisBrushEnded(variable) {
            var extent = variable.brush.extent();
            var empty = extent[0] == extent[1];
            if(!empty && variable.integer) {
                var f = variableViews[variable.xIndex].filter;
                f[0] = utils.d3OrdinalScaleSnap(variable.integerScale, f[0]);
                f[1] = utils.d3OrdinalScaleSnap(variable.integerScale, f[1]);
                if(f[0] === f[1]) {
                    f[0] = Math.max(0, f[0] - 0.05);
                    f[1] = Math.min(1, f[1] + 0.05);
                }
                d3.select(this).transition().duration(150).call(variable.brush.extent(f));
                variable.parent['focusLineLayer'].render(variableViews, true);
            }
            domainBrushing = false;
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