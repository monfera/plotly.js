/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var handleXYDefaults = require('../scatter/xy_defaults');

var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('marker.color', defaultColor);
    coerce('marker.opacity'/*, isBubble ? 0.7 : 1*/);
    coerce('marker.sizemin');
    coerce('marker.sizemax');
    coerce('marker.border.color', defaultColor);
    coerce('marker.border.arearatio');
};
