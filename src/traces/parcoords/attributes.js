/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttributes = require('../../components/colorscale/color_attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

/*
todo comments (some of them relating to items that should be unexposed anyway):
- `domain` should be DRYed up across other plots
- add attribute to `dimensions` for switching dimensions on/off
- add attribute to `dimensions` for initial filter domain
- clarify what the actual use of `_isLinkedToArray: 'dimension'` - esp. the value - is below
- add attribute for color clamping
- switch to ploty standard color notation rather than RGB tuple
- switch to 0..1 for opacity rather than 0..255
- tie pixelratio to window.devicePixelRatio in `defaults.js`
- consider if we need a `focusopacity` attribute besides focusalphablending; making settings more symmetric between
      focus and context
- hardcode verticalpadding
- this minor but ergonomic `integerpadding` isn't fully working yet - either finish it or remove it
*/

module.exports = {

    domain: {
        x: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1},
                {valType: 'number', min: 0, max: 1}
            ],
            dflt: [0, 1],
            description: [
                'Sets the horizontal domain of this `parcoords` trace',
                '(in plot fraction).'
            ].join(' ')
        },
        y: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1},
                {valType: 'number', min: 0, max: 1}
            ],
            dflt: [0, 1],
            description: [
                'Sets the vertical domain of this `parcoords` trace',
                '(in plot fraction).'
            ].join(' ')
        }
    },

    dimensions: {
        _isLinkedToArray: 'dimension',
        id: {
            valType: 'string',
            role: 'info',
            description: 'Identifier of a dimension. Must be a unique string across all dimensions.'
        },
        label: {
            valType: 'string',
            role: 'info',
            description: 'The shown name of the dimension.'
        },
        integer: {
            valType: 'boolean',
            dflt: false,
            role: 'info',
            description: 'The shown name of the dimension.'
        },
        hidden: {
            valType: 'boolean',
            dflt: false,
            role: 'info',
            description: 'Hides the dimension when set to true.'
        },
        values: {
            valType: 'data_array',
            role: 'info',
            description: [
                'Dimension values. `values[n]` represents the value of the `n`th point in the dataset,',
                'therefore the `values` vector for all dimensions must be the same (longer vectors',
                'will be truncated). Each value must be a finite number.'
            ].join(' ')
        },
        description: 'The dimensions (variables) of the parallel coordinates chart.'
    },

    tickdistance: {
        valType: 'number',
        dflt: 50,
        min: 32,
        role: 'style',
        description: 'The desired approximate tick distance (in pixels) between axis ticks on an axis.'
    },

    line: extendFlat({},
        colorAttributes('line'),
        {
            showscale: {
                valType: 'boolean',
                role: 'info',
                dflt: false,
                description: [
                    'Has an effect only if `marker.color` is set to a numerical array.',
                    'Determines whether or not a colorbar is displayed.'
                ].join(' ')
            },
            colorbar: colorbarAttrs
        }
    ),

    lines: {
        contextcolor: {
            valType: 'data_array',
            dflt: [0, 0, 0],
            role: 'style',
            description: 'Color of the context line layer as an RGB triplet where each number is 0..255.'
        },

        contextopacity: {
            valType: 'number',
            dflt: 16,
            min: 0,
            max: 255,
            role: 'style',
            description: 'Opacity of the context lines, on a scale of 0 (invisible) to 255 (fully opaque).'
        },

        pixelratio: {
            valType: 'number',
            dflt: 1,
            min: 0.25,
            max: 4,
            role: 'style',
            description: 'Line rendering pixel ratio. A lower value yields faster rendering but blockier lines.'
        },

        blocklinecount: {
            valType: 'number',
            dflt: 5000,
            min: 1,
            role: 'info',
            description: [
                'The number of lines rendered in one 16ms rendering frame. Use 2000-5000 on low-end hardware to remain',
                'responsive, and 10000 .. 100000 on strong hardware for faster rendering.'
            ].join(' ')
        },

        focusalphablending: {
            valType: 'boolean',
            dflt: false,
            role: 'style',
            description: [
                'By default, the rendered lines are opaque. Setting it to `true` is necessary if opacity is needed.'
            ].join(' ')
        },

        verticalpadding: {
            valType: 'number',
            dflt: 2,
            min: 0,
            max: 4,
            role: 'style',
            description: 'Lines have thickness, and without padding, horizontal lines at extreme values appear thinner.'
        },

        integerpadding: {
            valType: 'number',
            dflt: 0,
            min: 0,
            max: 1,
            role: 'style',
            description: 'Setting it to `1` offsets the extreme points on integer axes by half pitch.'
        }
    },

    filterbar: {

        width: {
            valType: 'number',
            dflt: 4,
            min: 2,
            max: 20,
            role: 'style',
            description: 'Visible width of the filter bar.'
        },

        fillcolor: {
            valType: 'color',
            dflt: 'magenta',
            role: 'style',
            description: 'Color of the filter bar fill.'
        },

        fillopacity: {
            valType: 'number',
            dflt: 1,
            min: 0,
            max: 1,
            role: 'style',
            description: 'Filter bar fill opacity.'
        },

        strokecolor: {
            valType: 'color',
            dflt: 'white',
            role: 'style',
            description: 'Color of the filter bar side lines.'
        },

        strokeopacity: {
            valType: 'number',
            dflt: 1,
            min: 0,
            max: 1,
            arrayOk: true,
            role: 'style',
            description: 'Filter bar side stroke opacity.'
        },

        strokewidth: {
            valType: 'number',
            dflt: 1,
            min: 0,
            max: 2,
            role: 'style',
            description: 'Filter bar side stroke width.'
        },

        handleheight: {
            valType: 'number',
            dflt: 16,
            min: 2,
            max: 20,
            role: 'style',
            description: 'Height of the filter bar vertical resize areas on top and bottom.'
        },

        handleopacity: {
            valType: 'number',
            dflt: 1,
            min: 0,
            max: 1,
            arrayOk: true,
            role: 'style',
            description: 'Opacity of the filter bar vertical resize areas on top and bottom.'
        },

        handleoverlap: {
            valType: 'number',
            dflt: 0,
            min: 0,
            max: 4,
            role: 'style',
            description: [
                'If zero, the vertical resize areas on top and bottom are just above and below the filter bar itself.',
                'A larger than zero value causes overlaps with the filter bar. The overlap is represented as pixels.'
            ].join(' ')
        }
    }
};
