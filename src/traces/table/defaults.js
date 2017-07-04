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

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

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
    coerce('prefix');
    coerce('suffix');

    coerce('width');
    coerce('height');
    coerce('align');
    coerce('valign');

    coerce('line.width');
    coerce('line.color');

    coerce('fill.color');

    Lib.coerceFont(coerce, 'labelfont', fontDflt);
    Lib.coerceFont(coerce, 'font', fontDflt);
};
