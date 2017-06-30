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

function handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce) {

    if(hasColorscale(traceIn, 'line')) {
        coerce('line.colorscale');
        colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: 'line.', cLetter: 'c'});
    }
}

function dimensionsDefaults(traceIn, traceOut) {
    var dimensionsIn = traceIn.dimensions || [],
        dimensionsOut = traceOut.dimensions = [];

    var dimensionIn, dimensionOut, i;
    var commonLength = Infinity;

    if(dimensionsIn.length > maxDimensionCount) {
        Lib.log('table views support up to ' + maxDimensionCount + ' dimensions at the moment');
        dimensionsIn.splice(maxDimensionCount);
    }

    function coerce(attr, dflt) {
        return Lib.coerce(dimensionIn, dimensionOut, attributes.dimensions, attr, dflt);
    }

    for(i = 0; i < dimensionsIn.length; i++) {
        dimensionIn = dimensionsIn[i];
        dimensionOut = {};

        if(!Lib.isPlainObject(dimensionIn)) {
            continue;
        }

        //var values = coerce('values');
        var visible = coerce('visible');

        if(visible) {
            coerce('label');
            coerce('tickvals');
            coerce('ticktext');
            coerce('valueformat');
            coerce('range');
        }

        dimensionOut._index = i;
        dimensionsOut.push(dimensionOut);
    }

    if(isFinite(commonLength)) {
        for(i = 0; i < dimensionsOut.length; i++) {
            dimensionOut = dimensionsOut[i];
            if(dimensionOut.visible && dimensionOut.values.length > commonLength) {
                dimensionOut.values = dimensionOut.values.slice(0, commonLength);
            }
        }
    }

    return dimensionsOut;
}

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var dimensions = dimensionsDefaults(traceIn, traceOut);

    handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);

    // make default font size 10px,
    // scale linearly with global font size
    var fontDflt = {
        family: layout.font.family,
        size: Math.round(layout.font.size * (10 / 12)),
        color: layout.font.color
    };

    coerce('domain.x');
    coerce('domain.y');

    coerce('values');

    if(!Array.isArray(dimensions) || !dimensions.length) {
        traceOut.visible = false;
    }

    Lib.coerceFont(coerce, 'labelfont', fontDflt);
    Lib.coerceFont(coerce, 'font', fontDflt);
};
