/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var hasColorscale = require('../../components/colorscale/has_colorscale');
var colorscaleDefaults = require('../../components/colorscale/defaults');
var maxDimensionCount = require('./constants').maxDimensionCount;

function handleFillDefaults(traceIn, traceOut, defaultColor, layout, coerce) {

    coerce('fill.color');
    if(hasColorscale(traceIn, 'fill')) {
        coerce('fill.colorscale');
        colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: 'fill.', cLetter: 'c'});
    }
}

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    handleFillDefaults(traceIn, traceOut, defaultColor, layout, coerce);

    var fontDflt = {
        family: layout.font.family,
        size: layout.font.size,
        color: layout.font.color
    };

    coerce('domain.x');
    coerce('domain.y');

    coerce('labels');
    coerce('values');
    coerce('valueformat');

    coerce('width');

    coerce('line.width');
    coerce('line.color');

    Lib.coerceFont(coerce, 'labelfont', fontDflt);
    Lib.coerceFont(coerce, 'font', fontDflt);
};
