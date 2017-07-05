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

    coerce('columnwidth');

    coerce('cells.values');
    coerce('cells.format');
    coerce('cells.align');
    coerce('cells.valign');
    coerce('cells.prefix');
    coerce('cells.suffix');
    coerce('cells.height');

    coerce('cells.line.width');
    coerce('cells.line.color');

    coerce('cells.fill.color');

    Lib.coerceFont(coerce, 'cells.font', fontDflt);

    Lib.coerceFont(coerce, 'labelfont', fontDflt);
};
