/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var tinycolor = require('tinycolor2');
var d3 = require('d3');

function _convertArray(convert, data, count) {
    var result = new Array(count),
        data0 = data[0];

    for(var i = 0; i < count; ++i) {
        result[i] = (i >= data.length) ?
            convert(data0) :
            convert(data[i]);
    }

    return result;
}

var Color = require('../../components/color');
var calcColorscale = require('./colorscale_calc');
var helpers = require('./helpers');

module.exports = function calc(gd, trace) {
    var vals = trace.dimensions,
        labels = trace.labels,
        cd = [],
        fullLayout = gd._fullLayout,
        colorMap = fullLayout._piecolormap,
        allThisTraceLabels = {},
        needDefaults = false,
        vTotal = 0,
        hiddenLabels = fullLayout.hiddenlabels || [],
        i,
        v,
        label,
        color,
        hidden,
        pt;

    if(trace.dlabel) {
        labels = new Array(vals.length);
        for(i = 0; i < vals.length; i++) {
            labels[i] = String(trace.label0 + i * trace.dlabel);
        }
    }

    for(i = 0; i < vals.length; i++) {
        v = vals.length - i // vals[i].pieChartCheat;
        if(!isNumeric(v)) continue;
        v = +v;
        if(v < 0) continue;

        label = labels[i];
        if(label === undefined || label === '') label = i;
        label = String(label);
        // only take the first occurrence of any given label.
        // TODO: perhaps (optionally?) sum values for a repeated label?
        if(allThisTraceLabels[label] === undefined) allThisTraceLabels[label] = true;
        else continue;

        color = tinycolor(trace.marker.colors[i]);
        if(color.isValid()) {
            color = Color.addOpacity(color, color.getAlpha());
            if(!colorMap[label]) {
                colorMap[label] = color;
            }
        }
        // have we seen this label and assigned a color to it in a previous trace?
        else if(colorMap[label]) color = colorMap[label];
        // color needs a default - mark it false, come back after sorting
        else {
            color = false;
            needDefaults = true;
        }

        hidden = hiddenLabels.indexOf(label) !== -1;

        if(!hidden) vTotal += v;

        cd.push({
            v: v,
            color: color,
            i: i,
            hidden: hidden,
            integer: vals[i].integer,
            label: vals[i].label,
            values: vals[i].values
        });
    }

    //if(trace.sort) cd.sort(function(a, b) { return b.v - a.v; });

    /**
     * now go back and fill in colors we're still missing
     * this is done after sorting, so we pick defaults
     * in the order slices will be displayed
     */

    if(needDefaults) {
        for(i = 0; i < cd.length; i++) {
            pt = cd[i];
            if(pt.color === false) {
                colorMap[pt.label] = pt.color = nextDefaultColor(fullLayout._piedefaultcolorcount);
                fullLayout._piedefaultcolorcount++;
            }
        }
    }

    // include the sum of all values in the first point
    if(cd[0]) cd[0].vTotal = vTotal;

    // now insert text
    if(trace.textinfo && trace.textinfo !== 'none') {
        var hasLabel = trace.textinfo.indexOf('label') !== -1,
            hasText = trace.textinfo.indexOf('text') !== -1,
            hasValue = trace.textinfo.indexOf('value') !== -1,
            hasPercent = trace.textinfo.indexOf('percent') !== -1,
            separators = fullLayout.separators,
            thisText;

        for(i = 0; i < cd.length; i++) {
            pt = cd[i];
            thisText = hasLabel ? [pt.label] : [];
            if(hasText && trace.text[pt.i]) thisText.push(trace.text[pt.i]);
            if(hasValue) thisText.push(helpers.formatPieValue(pt.v, separators));
            if(hasPercent) thisText.push(helpers.formatPiePercent(pt.v / vTotal, separators));
            pt.text = thisText.join('<br>');
        }
    }

    // todo should it be in defaults.js?
    calcColorscale(trace, trace.line.color, 'line', 'c');

    var colorStops = trace.line.colorscale.map(function(d) {return d[0];});
    var colorStrings = trace.line.colorscale.map(function(d) {return d[1];});
    var colorTuples = colorStrings.map(function(c) {return d3.rgb(c);})
    var prop = function(n) {return function(o) {return o[n];};};

    // We can't use d3 color interpolation as we may have non-uniform color palette raster
    // (various color stop distances).
    var polylinearUnitScales = 'rgb'.split('').map(function(key) {
        return d3.scale.linear()
            .clamp(true)
            .domain(colorStops)
            .range(colorTuples.map(prop(key)));
    });

    var colorToUnitScale = d3.scale.linear()
        .domain(d3.extent(trace.line.color));

    var unitMin = colorToUnitScale(trace.line.cmin);
    var unitMax = colorToUnitScale(trace.line.cmax);

    var cScale = d3.scale.linear()
        .clamp(true)
        .domain([unitMin, unitMax]);

    return [{
        domain: trace.domain,
        dimensions: cd,
        tickdistance: trace.tickdistance,
        lines: trace.lines,
        line: trace.line,
        unitToColor: function(d) {
            return polylinearUnitScales.map(function(s) {
                return s(cScale(d));
            });
        },
        filterbar: trace.filterbar
    }];
};

/**
 * pick a default color from the main default set, augmented by
 * itself lighter then darker before repeating
 */
var pieDefaultColors;

function nextDefaultColor(index) {
    if(!pieDefaultColors) {
        // generate this default set on demand (but then it gets saved in the module)
        var mainDefaults = Color.defaults;
        pieDefaultColors = mainDefaults.slice();

        var i;

        for(i = 0; i < mainDefaults.length; i++) {
            pieDefaultColors.push(tinycolor(mainDefaults[i]).lighten(20).toHexString());
        }

        for(i = 0; i < Color.defaults.length; i++) {
            pieDefaultColors.push(tinycolor(mainDefaults[i]).darken(20).toHexString());
        }
    }

    return pieDefaultColors[index % pieDefaultColors.length];
}
