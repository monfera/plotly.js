/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterglAttrs = require('../scattergl/attributes');

module.exports = {
    x: scatterglAttrs.x,
    x0: scatterglAttrs.x0,
    dx: scatterglAttrs.dx,
    y: scatterglAttrs.y,
    y0: scatterglAttrs.y0,
    dy: scatterglAttrs.dy,
    text: scatterglAttrs.text,
    marker: {
        color: {
            valType: 'color',
            arrayOk: false,
            role: 'style',
            description: [
                'Sets the marker fill color. It accepts a specific color.',
                'If the color is not fully opaque and there are hundreds of thousands',
                'of points, it may cause slower zooming and panning.'
            ].join('')
        },
        opacity: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            arrayOk: false,
            role: 'style',
            description: [
                'Sets the marker opacity. The default value is `1` (fully opaque).',
                'If the markers are not fully opaque and there are hundreds of thousands',
                'of points, it may cause slower zooming and panning.'
                ].join(' ')
        },
        sizemin: {
            valType: 'number',
            min: 0.1,
            max: 2,
            dflt: 0.5,
            role: 'style',
            description: [
                'Sets the minimum size (in px) of the rendered marker points, effective when',
                'the `pointcloud` shows a million or more points.'
            ].join(' ')
        },
        sizemax: {
            valType: 'number',
            min: 0.1,
            dflt: 0.5,
            role: 'style',
            description: [
                'Sets the maximum size (in px) of the rendered marker points.',
                'Effective when the `pointcloud` shows only few points.'
            ].join(' ')
        },
        border: {
            color: {
                valType: 'color',
                arrayOk: false,
                role: 'style',
                description: [
                    'Sets the stroke color. It accepts a specific color.',
                    'If the color is not fully opaque and there are hundreds of thousands',
                    'of points, it may cause slower zooming and panning.'
                ].join(' ')
            },
            arearatio: {
                valType: 'number',
                min: 0,
                max: 1,
                dflt: 0,
                role: 'style',
                description: [
                    "Specifies what fraction of the marker area is covered with the",
                    "border."
                ].join(' ')
            }
        }
    }
};
