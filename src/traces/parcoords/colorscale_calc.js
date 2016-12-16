/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var hasColorscale = require('../../components/colorscale/has_colorscale');
var calcColorscale = require('../../components/colorscale/calc');


// todo consider unifying common parts with e.g. `scatter`
module.exports = function calcMarkerColorscale(trace) {
    if(hasColorscale(trace, 'line')) {
        calcColorscale(trace, trace.line.color, 'line', 'c');
    }
};
