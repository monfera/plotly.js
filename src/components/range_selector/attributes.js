/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var fontAttrs = require('../../plots/font_attributes');
var colorAttrs = require('../color/attributes');
var extendFlat = require('../../lib/extend').extendFlat;
var buttonAttrs = require('./button_attributes');

module.exports = {
    visible: {
        valType: 'boolean',
        description: [
            'Determines whether or not this range selector is visible.'
        ].join(' ')
    },

    buttons: {
        role: 'object',
        items: buttonAttrs,
        description: [
            'buttons!!!'
        ].join(' ')
    },

    x: {
        valType: 'number',
        min: -2,
        max: 3,
        dflt: 0,
        role: 'style',
        description: 'Sets the x position (in normalized coordinates) of the range selector.'
    },
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'left',
        role: 'info',
        description: [
            'Sets the range selector \'s horizontal position anchor.',
            'This anchor binds the `x` position to the *left*, *center*',
            'or *right* of the range selector.'
        ].join(' ')
    },
    y: {
        valType: 'number',
        min: -2,
        max: 3,
        dflt: 1,
        role: 'style',
        description: 'Sets the y position (in normalized coordinates) of the range selector.'
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'auto',
        role: 'info',
        description: [
            'Sets the range selector\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the range selector.'
        ].join(' ')
    },

    font: extendFlat({}, fontAttrs, {
        description: 'Sets the font used to text the range selector buttons.'
    }),

    bgcolor: {
        valType: 'color',
        role: 'style',
        description: 'Sets the range selector background color.'
    },
    bordercolor: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        role: 'style',
        description: 'Sets the color of the border enclosing the range selector.'
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 0,
        role: 'style',
        description: 'Sets the width (in px) of the border enclosing the range selector.'
    }
};
