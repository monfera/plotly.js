/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var lineLayerMaker = require('./lines');
var Lib = require('../../lib');
var d3 = require('d3');

var overdrag = 40;
var legendWidth = 80;

function keyFun(d) {return d.key;}

function repeat(d) {return [d];}

function visible(dimension) {return !dimension.hidden;}

function ordinalScaleSnap(scale, v) {
    var i, a, prevDiff, prevValue, diff;
    for(i = 0, a = scale.range(), prevDiff = Infinity, prevValue = a[0], diff; i < a.length; i++) {
        if((diff = Math.abs(a[i] - v)) > prevDiff) {
            return prevValue;
        }
        prevDiff = diff;
        prevValue = a[i];
    }
    return a[a.length - 1];
}

function domainScale(height, padding, integerPadding, dimension) {
    var lo = d3.min(dimension.values);
    var hi = d3.max(dimension.values);
    // convert a zero-domain to a proper domain
    if(!dimension.integer && lo === hi) {
        lo *= 0.9;
        hi *= 1.1;
    }
    return dimension.integer ?
        d3.scale.ordinal()
            .domain(d3.range(Math.round(lo), Math.round(hi + 1)))
            .rangePoints([height - padding, padding], integerPadding) :
        d3.scale.linear()
            .domain([lo, hi])
            .range([height - padding, padding]);
}

function unitScale(height, padding) {
    return d3.scale.linear().range([height - padding, padding]);
}

function integerScale(integerPadding, dimension) {
    return dimension.integer && d3.scale.ordinal()
            .domain(d3.range(0, Math.round(d3.max(dimension.values) + 1) - Math.round(d3.min(dimension.values)))
                .map(function(d, _, a) {return d / (a.length - 1);}))
            .rangePoints([0, 1], integerPadding);
}

function domainToUnitScale(values) {
    var extent = d3.extent(values);
    if(extent[0] === extent[1]) {
        extent[0]--;
        extent[1]++;
    }
    return d3.scale.linear().domain(extent);
}

function model(layout, d) {

    var data = d.dimensions;

    var canvasPixelRatio = d.lines.pixelratio;
    var lines = Lib.extendDeep(d.lines, {
        color: d.line.color.map(domainToUnitScale(d.line.color)),
        canvasOverdrag: overdrag * canvasPixelRatio
    });

    var layoutWidth = layout.width * (d.domain.x[1] - d.domain.x[0]);
    var layoutHeight = layout.height * (d.domain.y[1] - d.domain.y[0]);

    var padding = d.padding || 80;
    var translateX = (d.domain.x[0] || 0) * layout.width;
    var translateY = (d.domain.y[0] || 0) * layout.height;
    var width = layoutWidth - 2 * padding - legendWidth; // leavig room for the colorbar
    var height = layoutHeight - 2 * padding;

    var canvasWidth = width * canvasPixelRatio + 2 * lines.canvasOverdrag;
    var canvasHeight = height * canvasPixelRatio;

    var resizeHeight = d.filterbar.handleheight;
    var brushVisibleWidth = d.filterbar.width;
    var brushCaptureWidth = d.filterbar.capturewidth || Math.min(32, brushVisibleWidth + 16);

    return {
        key: Math.random(),
        dimensions: data,
        tickDistance: d.tickdistance,
        unitToColor: d.unitToColor,
        lines: lines,
        translateX: translateX,
        translateY: translateY,
        padding: padding,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        width: width,
        height: height,
        brushVisibleWidth: brushVisibleWidth,
        brushCaptureWidth: brushCaptureWidth,
        resizeHeight: resizeHeight,
        canvasPixelRatio: canvasPixelRatio,
        filterBar: d.filterbar
    };
}

function viewModel(model) {

    var lines = model.lines;
    var width = model.width;
    var height = model.height;
    var canvasPixelRatio = model.canvasPixelRatio;

    var xScale = d3.scale.ordinal().domain(d3.range(model.dimensions.filter(visible).length)).rangePoints([0, width], 0);

    var unitPad = lines.verticalpadding / (height * canvasPixelRatio);
    var unitPadScale = (1 - 2 * unitPad);
    var paddedUnitScale = function(d) {return unitPad + unitPadScale * d;};

    var viewModel = {
        key: model.key,
        xScale: xScale,
        model: model
    };

    viewModel.panels = model.dimensions.filter(visible).map(function(dimension, i) {
        var domainToUnit = domainToUnitScale(dimension.values);
        return {
            key: dimension.id || (dimension.label + ' ' + Math.floor(1e6 * Math.random())),
            label: dimension.label,
            integer: dimension.integer,
            scatter: dimension.scatter,
            xIndex: i,
            originalXIndex: i,
            height: height,
            values: dimension.values,
            paddedUnitValues: dimension.values.map(domainToUnit).map(paddedUnitScale),
            xScale: xScale,
            x: xScale(i),
            canvasX: xScale(i) * canvasPixelRatio,
            unitScale: unitScale(height, lines.verticalpadding),
            domainScale: domainScale(height, lines.verticalpadding, lines.integerpadding, dimension),
            integerScale: integerScale(lines.integerpadding, dimension),
            domainToUnitScale: domainToUnit,
            pieChartCheat: dimension.pieChartCheat,
            filter: dimension.constraintrange ? dimension.constraintrange.map(domainToUnit) : [0, 1],
            parent: viewModel,
            model: model
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

module.exports = function(root, styledData, layout, callbacks) {

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
            .attr('width', function(d) {return d.model.brushCaptureWidth;})
            .attr('height', function(d) {return d.model.height})
            .attr('x', function(d) {return -d.model.brushVisibleWidth;})
            .attr('patternUnits', 'userSpaceOnUse');

        var filterBarPatternGlyph = filterBarPattern.selectAll('rect')
            .data(repeat, keyFun);

        filterBarPatternGlyph.enter()
            .append('rect')
            .attr('shape-rendering', 'crispEdges')
            .attr('width', function(d) {return d.model.brushVisibleWidth})
            .attr('height', function(d) {return d.model.height})
            .attr('x', function(d) {return d.model.brushVisibleWidth / 2;})
            .attr('fill', function(d) {return d.model.filterBar.fillcolor;})
            .attr('fill-opacity', function(d) {return d.model.filterBar.fillopacity;})
            .attr('stroke', function(d) {return d.model.filterBar.strokecolor;})
            .attr('stroke-opacity', function(d) {return d.model.filterBar.strokeopacity;})
            .attr('stroke-width', function(d) {return d.model.filterBar.strokewidth;});
    }

    var parcoordsModel = d3.select(root).selectAll('.parcoordsModel')
        .data([model(layout, styledData)], keyFun);

    parcoordsModel.enter()
        .append('div')
        .style('position', 'relative')
        .classed('parcoordsModel', true);

    var parcoordsViewModel = parcoordsModel.selectAll('.parcoordsViewModel')
        .data(viewModel, keyFun);

    parcoordsViewModel.enter()
        .append('div')
        .classed('parcoordsViewModel', true)
        .style('transform', function(d) {return 'translate(' + d.model.translateX + 'px,' + d.model.translateY + 'px)';});

    var parcoordsLineLayer = parcoordsViewModel.selectAll('.parcoordsLineLayer')
        .data(function(vm) {
            return [true, false].map(function(context) {
                return {
                    key: context ? 'contextLineLayer' : 'focusLineLayer',
                    context: context,
                    viewModel: vm,
                    model: vm.model
                };
            });
        }, keyFun);

    parcoordsLineLayer.enter()
        .append('canvas')
        .classed('parcoordsLineLayer', true)
        .style('transform', 'translate(' + (-overdrag) + 'px, 0)')
        .style('float', 'left')
        .style('clear', 'both')
        .style('position', function(d, i) {return i > 0 ? 'absolute' : 'static'})
        .style('left', 0)
        .style('padding', function(d) {return d.viewModel.model.padding + 'px';})
        .style('overflow', 'visible')
        .attr('width', function(d) {return d.viewModel.model.canvasWidth;})
        .attr('height', function(d) {return d.viewModel.model.canvasHeight;})
        .style('width', function(d) {return (d.viewModel.model.width + 2 * overdrag) + 'px';})
        .style('height', function(d) {return d.viewModel.model.height + 'px';});

    var tweakables = {renderers: [], dimensions: []};

    parcoordsLineLayer
        .each(function(d) {
            var lineLayer = lineLayerMaker(this, d.model.lines, d.model.canvasWidth, d.model.canvasHeight, d.viewModel.panels, d.model.unitToColor, d.context);
            d.viewModel[d.key] = lineLayer;
            tweakables.renderers.push(function() {lineLayer.render(d.viewModel.panels, true);});
            lineLayer.render(d.viewModel.panels, !d.context, d.context && !someFiltersActive(d.viewModel));
        });

    var parcoordsControlOverlay = parcoordsViewModel.selectAll('.parcoordsControlOverlay')
        .data(repeat, keyFun);

    parcoordsControlOverlay.enter()
        .append('svg')
        .classed('parcoordsControlOverlay', true)
        .attr('overflow', 'visible')
        .attr('width', function(d) {return d.model.width + 2 * d.model.padding;})
        .attr('height', function(d) {return d.model.height + 2 * d.model.padding;})
        .style('position', 'absolute')
        .style('left', 0)
        .style('overflow', 'visible')
        .style('shape-rendering', 'crispEdges')
        .call(enterSvgDefs);

    var parcoordsControlView = parcoordsControlOverlay.selectAll('.parcoordsControlView')
        .data(repeat, keyFun);

    parcoordsControlView.enter()
        .append('g')
        .attr('transform', function(d) {return 'translate(' + d.model.padding + ',' + d.model.padding + ')';})
        .classed('parcoordsControlView', true);

    var clearFix = parcoordsViewModel.selectAll('.clearFix')
        .data(repeat, keyFun);

    clearFix.enter()
        .append('br')
        .classed('clearFix', true)
        .style('clear', 'both');

    var panel = parcoordsControlView.selectAll('.panel')
        .data(function(vm) {return vm.panels;}, keyFun);

    var domainBrushing = false;

    function someFiltersActive(view) {
        return view.panels.some(function(p) {return p.filter[0] !== 0 || p.filter[1] !== 1;});
    }

    panel.enter()
        .append('g')
        .classed('panel', true)
        .each(function(d) {tweakables.dimensions.push(d);});

    panel
        .attr('transform', function(d) {return 'translate(' + d.xScale(d.xIndex) + ', 0)';});

    panel
        .call(d3.behavior.drag()
            .origin(function(d) {return d;})
            .on('drag', function(d) {
                if(domainBrushing) {
                    return;
                }
                d.x = Math.max(-overdrag, Math.min(d.model.width + overdrag, d3.event.x));
                d.canvasX = d.x * d.model.canvasPixelRatio;
                panel
                    .sort(function(a, b) {return a.x - b.x;})
                    .each(function(dd, i) {
                        dd.xIndex = i;
                        dd.x = d === dd ? dd.x : dd.xScale(dd.xIndex);
                        dd.canvasX = dd.x * dd.model.canvasPixelRatio;
                    });
                panel.filter(function(dd) {return Math.abs(d.xIndex - dd.xIndex) !== 0;})
                    .attr('transform', function(d) {return 'translate(' + d.xScale(d.xIndex) + ', 0)';});
                d3.select(this).attr('transform', 'translate(' + d.x + ', 0)');
                panel.each(function(d, i) {d.parent.panels[i] = d;});
                d.parent.contextLineLayer.render(d.parent.panels, false, !someFiltersActive(d.parent));
                d.parent.focusLineLayer.render(d.parent.panels);
            })
            .on('dragend', function(d) {
                if(domainBrushing) {
                    return;
                }
                d.x = d.xScale(d.xIndex);
                d.canvasX = d.x * d.model.canvasPixelRatio;
                d3.select(this)
                    .attr('transform', function(d) {return 'translate(' + d.x + ', 0)';});
                d.parent.contextLineLayer.render(d.parent.panels, false, !someFiltersActive(d.parent));
                d.parent.focusLineLayer.render(d.parent.panels);
            })
        );

    panel.exit()
        .remove();

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
            var wantedTickCount = d.model.height / d.model.tickDistance;
            var scale = d.domainScale;
            var dom = scale.domain();
            d3.select(this)
                .call(d3.svg.axis()
                    .orient('left')
                    .tickSize(4)
                    .outerTickSize(2)
                    .ticks(wantedTickCount, '3s') // works for continuous scales only...
                    .tickValues(d.integer ? // and this works for ordinal scales
                        dom.filter(function(d, i) {return !(i % Math.round((dom.length / wantedTickCount)));}) :
                        null)
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
        .classed('axisHeading', true);

    var axisTitle = axisHeading.selectAll('.axisTitle')
        .data(repeat, keyFun);

    axisTitle.enter()
        .append('text')
        .classed('axisTitle', true)
        .attr('transform', function(d) {return 'translate(0,' + -(d.model.filterBar.handleheight + 20) + ')';})
        .text(function(d) {return d.label;})
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
        .attr('transform', function(d) {return 'translate(' + 0 + ',' + -(d.model.filterBar.handleheight - 2) + ')';});

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
        .attr('transform', function(d) {return 'translate(' + 0 + ',' + (d.model.height + d.model.filterBar.handleheight - 2) + ')';});

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
        .classed('axisBrush', true);

    axisBrushEnter
        .each(function(d) {
            if(!d.brush) {
                d.brush = d3.svg.brush()
                    .y(d.unitScale)
                    .on('brushstart', axisBrushStarted)
                    .on('brush', axisBrushMoved)
                    .on('brushend', axisBrushEnded);
                if(d.filter[0] !== 0 || d.filter[1] !== 1) {
                    d.brush.extent(d.filter);
                }
                d3.select(this).call(d.brush).call(d.brush.event);
            }
        });

    axisBrushEnter
        .selectAll('rect')
        .attr('x', function() {var d = this.parentElement.parentElement.__data__; return -d.model.brushCaptureWidth / 2;})
        .attr('width', function() {var d = this.parentElement.parentElement.__data__; return d.model.brushCaptureWidth;});

    axisBrushEnter
        .selectAll('rect.extent')
        .attr('fill', 'url(#filterBarPattern)')
        .filter(function(d) {return d.filter[0] === 0 && d.filter[1] === 1})
        .attr('y', -100); //  // zero-size rectangle pointer issue workaround

    axisBrushEnter
        .selectAll('.resize rect')
        .attr('height', function() {var d = this.parentElement.parentElement.__data__; return d.model.resizeHeight;})
        .attr('opacity', 0)
        .style('visibility', 'visible');

    axisBrushEnter
        .selectAll('.resize.n rect')
        .attr('y', function() {var d = this.parentElement.parentElement.__data__; return -d.model.resizeHeight + d.model.filterBar.handleoverlap;});

    axisBrushEnter
        .selectAll('.resize.s rect')
        .attr('y', function() {var d = this.parentElement.parentElement.__data__; return -d.model.filterBar.handleoverlap;});

    var justStarted = false;
    var contextShown = false;

    function axisBrushStarted() {
        justStarted = true;
        domainBrushing = true;
    }

    function axisBrushMoved(dimension) {
        var extent = dimension.brush.extent();
        var panels = dimension.parent.panels;
        var filter = panels[dimension.xIndex].filter;
        var reset = justStarted && (extent[0] === extent[1]);
        if(reset) {
            dimension.brush.clear();
            d3.select(this).select('rect.extent').attr('y', -100); // zero-size rectangle pointer issue workaround
        }
        var newExtent = reset ? [0, 1] : extent.slice();
        if(newExtent[0] !== filter[0] || newExtent[1] !== filter[1]) {
            panels[dimension.xIndex].filter = newExtent;
            dimension.parent.focusLineLayer.render(panels, true);
            var filtersActive = someFiltersActive(dimension.parent);
            if(!contextShown && filtersActive) {
                dimension.parent.contextLineLayer.render(panels, true);
                contextShown = true;
            } else if(contextShown && !filtersActive) {
                dimension.parent.contextLineLayer.render(panels, true, true);
                contextShown = false;
            }
        }
        justStarted = false;
    }

    function axisBrushEnded(dimension) {
        var extent = dimension.brush.extent();
        var empty = extent[0] === extent[1];
        var panels = dimension.parent.panels;
        var f = panels[dimension.xIndex].filter;
        if(!empty && dimension.integer) {
            f[0] = ordinalScaleSnap(dimension.integerScale, f[0]);
            f[1] = ordinalScaleSnap(dimension.integerScale, f[1]);
            if(f[0] === f[1]) {
                f[0] = Math.max(0, f[0] - 0.05);
                f[1] = Math.min(1, f[1] + 0.05);
            }
            d3.select(this).transition().duration(150).call(dimension.brush.extent(f));
            dimension.parent.focusLineLayer.render(panels, true);
        }
        domainBrushing = false;
        if(callbacks && callbacks.filterChangedCallback) {
            callbacks.filterChangedCallback({
                changedDimension: {
                    key: dimension.key,
                    label: dimension.label,
                    domainFilter: f.map(dimension.domainToUnitScale.invert),
                    fullDomain: f[0] === 0 && f[1] === 1
                },
                allDimensions: panels.map(function(p) {
                    return {
                        key: p.key,
                        label: p.label,
                        domainFilter: p.filter.map(p.domainToUnitScale.invert),
                        fullDomain: p.filter[0] === 0 && p.filter[1] === 1
                    };
                })
            });
        };
    }

    return tweakables;
};
