/**
* Copyright 2012-2016, Plotly, Inc.
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

    var coerceFont = Lib.coerceFont;

    var variables = coerce('variables');

    coerce('geometry.padding');
    coerce('geometry.tickdistance');

    coerce('filterbar.visiblewidth');
    coerce('filterbar.capturewidth');
    coerce('filterbar.fillcolor');
    coerce('filterbar.fillopacity');
    coerce('filterbar.strokecolor');
    coerce('filterbar.strokeopacity');
    coerce('filterbar.strokewidth');
    coerce('filterbar.handleheight');
    coerce('filterbar.handleoverlap');

    coerce('lines.coloringvariable');
    coerce('lines.contextcolor');
    coerce('lines.contextopacity');
    coerce('lines.pixelratio');
    coerce('lines.blocklinecount');
    coerce('lines.focusalphablending');
    coerce('lines.verticalpadding');
    coerce('lines.integerpadding');

    if(!Array.isArray(variables) || !variables.length) {
        traceOut.visible = false;
        return;
    }

    var labels = coerce('labels');
    if(!Array.isArray(labels)) {
        coerce('label0');
        coerce('dlabel');
    }

    var lineWidth = coerce('marker.line.width');
    if(lineWidth) coerce('marker.line.color');

    var colors = coerce('marker.colors');
    if(!Array.isArray(colors)) traceOut.marker.colors = []; // later this will get padded with default colors

    coerce('scalegroup');
    // TODO: tilt, depth, and hole all need to be coerced to the same values within a scaleegroup
    // (ideally actually, depth would get set the same *after* scaling, ie the same absolute depth)
    // and if colors aren't specified we should match these up - potentially even if separate pies
    // are NOT in the same sharegroup


    var textData = coerce('text');
    var textInfo = coerce('textinfo', Array.isArray(textData) ? 'text+percent' : 'percent');

    coerce('hoverinfo', (layout._dataLength === 1) ? 'label+text+value+percent' : undefined);

    if(textInfo && textInfo !== 'none') {
        var textPosition = coerce('textposition'),
            hasBoth = Array.isArray(textPosition) || textPosition === 'auto',
            hasInside = hasBoth || textPosition === 'inside',
            hasOutside = hasBoth || textPosition === 'outside';

        if(hasInside || hasOutside) {
            var dfltFont = coerceFont(coerce, 'textfont', layout.font);
            if(hasInside) coerceFont(coerce, 'insidetextfont', dfltFont);
            if(hasOutside) coerceFont(coerce, 'outsidetextfont', dfltFont);
        }
    }

    coerce('domain.x');
    coerce('domain.y');

    // 3D attributes commented out until I finish them in a later PR
    // var tilt = coerce('tilt');
    // if(tilt) {
    //     coerce('tiltaxis');
    //     coerce('depth');
    //     coerce('shading');
    // }

    coerce('hole');

    coerce('sort');
    coerce('direction');
    coerce('rotation');

    coerce('pull');
};
