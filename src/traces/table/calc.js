/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hasColorscale = require('../../components/colorscale/has_colorscale');
var calcColorscale = require('../../components/colorscale/calc');
var Lib = require('../../lib');

module.exports = function calc(gd, trace) {
    var cs = !!trace.fill.colorscale && Lib.isArray(trace.fill.color);
    var color = cs ? trace.fill.color : Array.apply(0, Array(trace.values[0].length)).map(function() {return 0.5;});
    var cscale = cs ? trace.fill.colorscale : [[0, trace.fill.color], [1, trace.fill.color]];

    if(hasColorscale(trace, 'line')) {
        calcColorscale(trace, trace.fill.color, 'line', 'c');
    }

    return [{
        lineColor: color,
        cscale: cscale
    }];
};
