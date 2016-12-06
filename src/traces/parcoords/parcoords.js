/**
 * Copyright 2012-2016, Plotly, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var lineLayerMaker = require('./lineLayer');
var unitToColor = require('./colors');
var utils = require('./utils');
var d3 = require('d3');

function keyFun(d) {
    return d.key;
}

function repeat(d) {
    return [d];
}

function makeDomainScale(height, padding, integerPadding, variable) {
    var lo = d3.min(variable.values);
    var hi = d3.max(variable.values);
    // convert a zero-domain to a proper domain
    if(!variable.integer && lo === hi) {
        lo *= 0.9;
        hi *= 1.1;
    }
    return variable.integer
        ? d3.scale.ordinal()
        .domain(d3.range(Math.round(lo), Math.round(hi + 1)))
        .rangePoints([height - padding, padding], integerPadding)
        : d3.scale.linear()
        .domain([lo, hi])
        .range([height - padding, padding]);
}

function makeUnitScale(height, padding) {
    return d3.scale.linear()
        .range([height - padding, padding]);
}

function makeIntegerScale(integerPadding, variable) {
    return variable.integer && d3.scale.ordinal()
            .domain(
                d3.range(0, Math.round(d3.max(variable.values) + 1) - Math.round(d3.min(variable.values)))
                    .map(function(d, _, a) {return d / (a.length - 1)})
            )
            .rangePoints([0, 1], integerPadding)
}

function makeDomainToUnitScale(variable) {
    var extent = d3.extent(variable.values);
    if(extent[0] === extent[1]) {
        extent[0]--;
        extent[1]++;
    }
    var a = 1 / (extent[1] - extent[0]);
    var b = -a * extent[0];
    return function(x) {return a * x + b};
}

function viewModel(config, model) {

    var xScale = d3.scale.ordinal().domain(d3.range(model.variables.length)).rangePoints([0, config.width], 0);

    var viewModel = {
        key: model.key,
        xScale: xScale
    };

    viewModel.panels = model.variables.map(function(variable, i) {
        return {
            key: variable.variableName,
            variableName: variable.variableName,
            integer:variable.integer,
            xIndex: i,
            originalXIndex: i,
            height: config.height,
            values: variable.values,
            xScale: xScale,
            x: xScale(i),
            unitScale: makeUnitScale(config.height, config.verticalPadding),
            domainScale: makeDomainScale(config.height, config.verticalPadding, config.integerPadding, variable),
            integerScale: makeIntegerScale(config.integerPadding, variable),
            domainToUnitScale: makeDomainToUnitScale(variable),
            pieChartCheat: variable.pieChartCheat,
            filter: [0, 1],
            parent: viewModel
        };
    });

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

module.exports = function (root, data, layout) {

    var width = layout.width
    var height = layout.height

    var resizeHeight = layout.handleGlyphHeight;
    var brushVisibleWidth = layout.filterVisibleWidth;
    var brushCaptureWidth = layout.filterCaptureWidth;

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
            .attr('fill', layout.filterBarFill)
            .attr('fill-opacity', layout.filterBarFillOpacity)
            .attr('stroke', layout.filterBarStroke)
            .attr('stroke-opacity', layout.filterBarStrokeOpacity)
            .attr('stroke-width', layout.filterBarStrokeWidth);
    }

    var lastApproached = null;

    var parcoordsModel = d3.select(root).selectAll('.parcoordsModel')
        .data([{key: 0, variables: data}], keyFun);

    parcoordsModel.enter()
        .append('div')
        .classed('parcoordsModel', true);

    var parcoordsViewModel = parcoordsModel.selectAll('.parcoordsViewModel')
        .data(viewModel.bind(0, layout), keyFun)

    parcoordsViewModel.enter()
        .append('div')
        .classed('parcoordsViewModel', true);

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

    parcoordsLineLayer.enter()
        .append('canvas')
        .classed('parcoordsLineLayer', true)
        .style('position', 'absolute')
        .style('padding', layout.padding + 'px')
        .style('overflow', 'visible');

    parcoordsLineLayer
        .each(function(d) {
            d.viewModel[d.key] = lineLayerMaker(this, layout, d.viewModel.panels, unitToColor, d.context);
            if(!d.context) {
                d.viewModel[d.key].render(d.viewModel.panels, true);
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
        .style('padding', layout.padding + 'px')
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
                panel.each(function(d, i) {d.parent.panels[i] = d;});
                d.parent['contextLineLayer'].render(d.parent.panels, false, !someFiltersActive(d.parent));
                d.parent['focusLineLayer'].render(d.parent.panels);
            })
            .on('dragend', function(d) {
                if(domainBrushing) {
                    return;
                }
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
            var wantedTickCount = height / layout.averageTickDistance;
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
        .attr('transform', 'translate(0,' + -(layout.handleGlyphHeight + 20) + ')')
        .text(function(d) {return d.variableName;})
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
        .attr('transform', 'translate(' + 0 + ',' + -(layout.handleGlyphHeight - 2) + ')')

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
        .attr('transform', 'translate(' + 0 + ',' + (height + layout.handleGlyphHeight - 2) + ')')

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
        .on('mouseenter', function approach(variable) {
            if(variable !== lastApproached) {
                variable.parent['focusLineLayer'].approach(variable);
                lastApproached = variable;
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
        .attr('stroke', layout.captureZoneBorderColor);

    axisBrushEnter
        .selectAll('rect.extent')
        .attr('fill', 'url(#filterBarPattern)')
        .attr('y', -100); //  // zero-size rectangle pointer issue workaround

    axisBrushEnter
        .selectAll('.resize rect')
        .attr('height', resizeHeight)
        .attr('fill-opacity', layout.handleGlyphOpacity)
        .style('visibility', 'visible');

    axisBrushEnter
        .selectAll('.resize.n rect')
        .attr('y', -resizeHeight + layout.handleGlyphOverlap);

    axisBrushEnter
        .selectAll('.resize.s rect')
        .attr('y', -layout.handleGlyphOverlap);

    var justStarted = false;
    var contextShown = false;

    function axisBrushStarted() {
        justStarted = true;
        domainBrushing = true;
    }

    function axisBrushMoved(variable) {
        var extent = variable.brush.extent();
        var panels = variable.parent.panels;
        var filter = panels[variable.xIndex].filter;
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
            panels[variable.xIndex].filter = newExtent;
            variable.parent['focusLineLayer'].render(panels, true);
            var filtersActive = someFiltersActive(variable.parent);
            if(!contextShown && filtersActive) {
                variable.parent['contextLineLayer'].render(panels, true);
                contextShown = true;
            } else if(contextShown && !filtersActive) {
                variable.parent['contextLineLayer'].render(panels, true, true);
                contextShown = false;
            }
        }
        justStarted = false;
    }

    function axisBrushEnded(variable) {
        var extent = variable.brush.extent();
        var empty = extent[0] == extent[1];
        if(!empty && variable.integer) {
            var panels = variable.parent.panels;
            var f = panels[variable.xIndex].filter;
            f[0] = utils.d3OrdinalScaleSnap(variable.integerScale, f[0]);
            f[1] = utils.d3OrdinalScaleSnap(variable.integerScale, f[1]);
            if(f[0] === f[1]) {
                f[0] = Math.max(0, f[0] - 0.05);
                f[1] = Math.min(1, f[1] + 0.05);
            }
            d3.select(this).transition().duration(150).call(variable.brush.extent(f));
            variable.parent['focusLineLayer'].render(panels, true);
        }
        domainBrushing = false;
    }
};
