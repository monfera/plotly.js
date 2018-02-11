/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var c = require('./constants');
var d3 = require('d3');
var keyFun = require('../../lib/gup').keyFun;
var repeat = require('../../lib/gup').repeat;

function getBrushExtent(brush) {
    return brush.d3brush.extent();
}

function setBrushExtent(brush, range) {
    brush.d3brush.extent(range);
}

function setBrushExtentWithTween(selection, brush, extent) {
    selection.transition().duration(150).call(brush.d3brush.extent(extent));
}


function clearBrushExtent(brush) {
    brush.d3brush.clear();
    d3.select(this).select('rect.extent').attr('y', -100); // zero-size rectangle pointer issue workaround
}

function makeBrush(uScale, state, callback, initialRange) {
    return {
        filter: initialRange,
        d3brush: d3.svg.brush()
            .y(uScale)
            .on('brushstart', axisBrushStarted(state))
            .on('brush', axisBrushMoved(state))
            .on('brushend', axisBrushEnded(state, callback))
    };
}

function addFilterBarDefs(defs) {
    var filterBarPattern = defs.selectAll('#' + c.id.filterBarPattern)
        .data(repeat, keyFun);

    filterBarPattern.enter()
        .append('pattern')
        .attr('id', c.id.filterBarPattern)
        .attr('patternUnits', 'userSpaceOnUse');

    filterBarPattern
        .attr('x', -c.bar.width)
        .attr('width', c.bar.capturewidth)
        .attr('height', function(d) {return d.model.height;});

    var filterBarPatternGlyph = filterBarPattern.selectAll('rect')
        .data(repeat, keyFun);

    filterBarPatternGlyph.enter()
        .append('rect')
        .attr('shape-rendering', 'crispEdges');

    filterBarPatternGlyph
        .attr('height', function(d) {return d.model.height;})
        .attr('width', c.bar.width)
        .attr('x', c.bar.width / 2)
        .attr('fill', c.bar.fillcolor)
        .attr('fill-opacity', c.bar.fillopacity)
        .attr('stroke', c.bar.strokecolor)
        .attr('stroke-opacity', c.bar.strokeopacity)
        .attr('stroke-width', c.bar.strokewidth);
}

function ordinalScaleSnap(scale, v) {
    var i, a, prevDiff, prevValue, diff;
    for(i = 0, a = scale.range(), prevDiff = Infinity, prevValue = a[0]; i < a.length; i++) {
        diff = Math.abs(a[i] - v);
        if(diff > prevDiff) {
            return prevValue;
        }
        prevDiff = diff;
        prevValue = a[i];
    }
    return a[a.length - 1];
}

function filterActive(f) {
    // filter is active if it represents a proper subset of the [0, 1] domain AND a non-degenerate (non-zero width) domain
    return (f[0] > 0 || f[1] < 1) && f[0] < f[1];
}

function someFiltersActive(view) {
    return view.dimensions.some(function(p) {
        return filterActive(p.brush.filter);
    });
}

function axisBrushStarted(state) {
    return function axisBrushStarted() {
        // axes should not be dragged sideways while brushing (although fun to try)
        d3.event.sourceEvent.stopPropagation();
        state.linePickActive(false);
    };
}

function axisBrushMoved(state) {
    return function axisBrushMoved(dimension) {
        var p = dimension.parent;
        var extent = getBrushExtent(dimension.brush);
        var dimensions = p.dimensions;
        var filter = dimensions[dimension.xIndex].brush.filter;
        var reset = extent[0] === extent[1];
        if(reset) {
            clearBrushExtent(dimension.brush);
        }
        var newExtent = reset ? [0, 1] : extent.slice();
        if(newExtent[0] !== filter[0] || newExtent[1] !== filter[1]) {
            dimensions[dimension.xIndex].brush.filter = newExtent;
            p.focusLayer && p.focusLayer.render(p.panels, true);
            var filtersActive = someFiltersActive(p);
            if(!state.contextShown() && filtersActive) {
                p.contextLayer && p.contextLayer.render(p.panels, true);
                state.contextShown(true);
            } else if(state.contextShown() && !filtersActive) {
                p.contextLayer && p.contextLayer.render(p.panels, true, true);
                state.contextShown(false);
            }
        }
    };
}

function axisBrushEnded(state, callback) {
    return function axisBrushEnded (dimension) {
        var p = dimension.parent;
        var extent = getBrushExtent(dimension.brush);
        var empty = extent[0] === extent[1];
        var dimensions = p.dimensions;
        var f = dimensions[dimension.xIndex].brush.filter;
        if(!empty && dimension.ordinal) {
            f[0] = ordinalScaleSnap(dimension.ordinalScale, f[0]);
            f[1] = ordinalScaleSnap(dimension.ordinalScale, f[1]);
            if(f[0] === f[1]) {
                f[0] = Math.max(0, f[0] - 0.05);
                f[1] = Math.min(1, f[1] + 0.05);
            }
            setBrushExtentWithTween(d3.select(this), dimension.brush, f);
            p.focusLayer.render(p.panels, true);
        }
        p.pickLayer && p.pickLayer.render(p.panels, true);
        state.linePickActive(true);
        if(callback) {
            var invScale = dimension.domainToUnitScale.invert;

            // update gd.data as if a Plotly.restyle were fired
            var newRange = f.map(invScale);
            callback(p.key, dimension.visibleIndex, newRange);
        }
    };
}

function setAxisBrush(axisBrush) {
    axisBrush
        .each(function updateBrushExtent(d) {
            // Set the brush programmatically if data requires so, eg. Plotly `constraintrange` specifies a proper subset.
            // This is only to ensure the SVG brush is correct; WebGL lines are controlled from `d.brush.filter` directly.
            var f = d.brush.filter;
            if(filterActive(f)) {
                setBrushExtent(d.brush, f);
            } else {
                clearBrushExtent(d.brush);
            }
        });
}

function renderAxisBrushEnter(axisBrushEnter) {

    axisBrushEnter
        .each(function establishBrush(d) {
            // establish the D3 brush on each axis so mouse capture etc. are set up
            d3.select(this).call(d.brush.d3brush);
        });

    axisBrushEnter
        .selectAll('rect')
        .attr('x', -c.bar.capturewidth / 2)
        .attr('width', c.bar.capturewidth);

    axisBrushEnter
        .selectAll('rect.extent')
        .attr('fill', 'url(#' + c.id.filterBarPattern + ')')
        .style('cursor', 'ns-resize')
        .filter(function (d) {
            return !filterActive(d.brush.filter);
        })
        .attr('y', -100); //  // zero-size rectangle pointer issue workaround

    axisBrushEnter
        .selectAll('.resize rect')
        .attr('height', c.bar.handleheight)
        .attr('opacity', 0)
        .style('visibility', 'visible');

    axisBrushEnter
        .selectAll('.resize.n rect')
        .style('cursor', 'n-resize')
        .attr('y', c.bar.handleoverlap - c.bar.handleheight);

    axisBrushEnter
        .selectAll('.resize.s rect')
        .style('cursor', 's-resize')
        .attr('y', c.bar.handleoverlap);
}

function renderAxisBrush(axisBrush) {
    axisBrush
        .each(function updateBrushExtent(d) {
            // the brush has to be reapplied on the DOM element to actually show the (new) extent, because D3 3.*
            // `d3.svg.brush` doesn't maintain references to the DOM elements:
            // https://github.com/d3/d3/issues/2918#issuecomment-235090514
            d3.select(this).call(d.brush.d3brush);
        });
}

function ensureAxisBrush(axisOverlays) {
    var axisBrush = axisOverlays.selectAll('.' + c.cn.axisBrush)
        .data(repeat, keyFun);

    var axisBrushEnter = axisBrush.enter()
        .append('g')
        .classed(c.cn.axisBrush, true);

    setAxisBrush(axisBrush);
    renderAxisBrushEnter(axisBrushEnter);
    renderAxisBrush(axisBrush);
}

module.exports = {
    addFilterBarDefs: addFilterBarDefs,
    makeBrush: makeBrush,
    ensureAxisBrush: ensureAxisBrush,
    someFiltersActive: someFiltersActive
}