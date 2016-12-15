/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var d3 = require('d3');

var calcColorscale = require('./colorscale_calc');

module.exports = function calc(gd, trace) {
    var vals = trace.dimensions,
        cd = [],
        i,
        v;
    for(i = 0; i < vals.length; i++) {
        v = vals.length - i;
        if(!isNumeric(v)) continue;
        v = +v;
        if(v < 0) continue;

        cd.push({
            v: v,
            i: i,
            integer: vals[i].integer,
            label: vals[i].label,
            values: vals[i].values
        });
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
