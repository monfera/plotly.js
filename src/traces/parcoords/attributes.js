/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttrs = require('../../components/color/attributes');
var fontAttrs = require('../../plots/font_attributes');
var plotAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;


module.exports = {

    // PARCOORDS ATTRIBUTES

    // todo add attribute to `dimensions` for switching dimensions on/off
    // todo add attribute to `dimensions` for initial filter domain
    dimensions: {
        // todo clarify what the actual use of `_isLinkedToArray: 'dimension'` - esp. the value - is below
        _isLinkedToArray: 'dimension',
        id: {
            valType: 'string',
            role: 'info',
            description: "Identifier of a dimension. Must be a unique string across all dimensions."
        },
        label: {
            valType: 'string',
            role: 'info',
            description: "The shown name of the dimension."
        },
        integer: {
            valType: 'boolean',
            dflt: false,
            role: 'info',
            description: "The shown name of the dimension."
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
        description: [
            'The desired approximate tick distance (in pixels) between axis ticks on an axis.'
        ]
    },

    geometry: {
        padding: {
            valType: 'number',
            dflt: 64,
            min: 64,
            max: 128,
            role: 'style',
            description: [
                'Width of the padding around the actual parcoords line painting area in pixels. Padding provides',
                'the perimeter space for text annotations such as dimension name labels, domain extent values,',
                'leftmost axis ticks and bar resize handles.'
            ]
        }
    },

    line: {
        color: {
            // todo check how it should maybe support a singular value (`arrayOk`) for monochromatic lines
            valType: 'data_array',
            role: 'info',
            description: [
                'Specifies the values that serve as the basis for coloring lines. The array values map linearly',
                'to the `colorscale`.'
            ].join(' ')
        }
    },

    // todo add attribute for color clamping
    lines: {
        // todo switch to ploty standard color notation rather than RGB tuple
        contextcolor: {
            valType: 'data_array',
            dflt: [0, 0, 0],
            role: 'style',
            description: 'Color of the context line layer as an RGB triplet where each number is 0..255.'
        },

        // todo switch to 0..1 rather than 0..255
        contextopacity: {
            valType: 'number',
            dflt: 16,
            min: 0,
            max: 255,
            role: 'style',
            description: 'Opacity of the context lines, on a scale of 0 (invisible) to 255 (fully opaque).'
        },

        // todo tie it to window.devicePixelRatio in `defaults.js`
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
            ]
        },

        // todo consider if we need a `focusopacity` attribute as well; making settings more symmetric between focus and context
        focusalphablending: {
            valType: 'boolean',
            dflt: false,
            role: 'style',
            description: [
                'By default, the rendered lines are opaque. Setting it to `true` is necessary if opacity is needed.'
            ]
        },

        // todo hardcode it
        verticalpadding: {
            valType: 'number',
            dflt: 2,
            min: 0,
            max: 4,
            role: 'style',
            description: 'Lines have thickness, and without padding, horizontal lines at extreme values appear thinner.'
        },

        // todo this minor but ergonomic thing isn't fully working yet - either finish it or remove it
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
            ]
        }
    },




    // OLD PIE CHART ATTRIBUTES BELOW


    labels: {
        valType: 'data_array',
        description: 'Sets the dimension labels.'
    },
    // equivalent of x0 and dx, if label is missing
    label0: {
        valType: 'number',
        role: 'info',
        dflt: 0,
        description: [
            'Alternate to `labels`.',
            'Builds a numeric set of labels.',
            'Use with `dlabel`',
            'where `label0` is the starting label and `dlabel` the step.'
        ].join(' ')
    },
    dlabel: {
        valType: 'number',
        role: 'info',
        dflt: 1,
        description: 'Sets the label step. See `label0` for more info.'
    },

    marker: {
        colors: {
            valType: 'data_array',  // TODO 'color_array' ?
            description: [
                'Sets the color of each sector of this parallel coordinates chart.',
                'If not specified, the default trace color set is used',
                'to pick the sector colors.'
            ].join(' ')
        },

        line: {
            color: {
                valType: 'color',
                role: 'style',
                dflt: colorAttrs.defaultLine,
                arrayOk: true,
                description: [
                    'Sets the color of the line enclosing each sector.'
                ].join(' ')
            },
            width: {
                valType: 'number',
                role: 'style',
                min: 0,
                dflt: 0,
                arrayOk: true,
                description: [
                    'Sets the width (in px) of the line enclosing each sector.'
                ].join(' ')
            }
        }
    },

    text: {
        valType: 'data_array',
        description: 'Sets text elements associated with each dimension.'
    },

    scalegroup: {
        valType: 'string',
        role: 'info',
        dflt: '',
        description: [
            'If there are multiple pies that should be sized according to',
            'their totals, link them by providing a non-empty group id here',
            'shared by every trace in the same group.'
        ].join(' ')
    },

    // labels (legend is handled by plots.attributes.showlegend and layout.hiddenlabels)
    textinfo: {
        valType: 'flaglist',
        role: 'info',
        flags: ['label', 'text', 'value', 'percent'],
        extras: ['none'],
        description: [
            'Determines which trace information appear on the graph.'
        ].join(' ')
    },
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: ['label', 'text', 'value', 'percent', 'name']
    }),
    textposition: {
        valType: 'enumerated',
        role: 'info',
        values: ['inside', 'outside', 'auto', 'none'],
        dflt: 'auto',
        arrayOk: true,
        description: [
            'Specifies the location of the `textinfo`.'
        ].join(' ')
    },
    // TODO make those arrayOk?
    textfont: extendFlat({}, fontAttrs, {
        description: 'Sets the font used for `textinfo`.'
    }),
    insidetextfont: extendFlat({}, fontAttrs, {
        description: 'Sets the font used for `textinfo` lying inside the pie.'
    }),
    outsidetextfont: extendFlat({}, fontAttrs, {
        description: 'Sets the font used for `textinfo` lying outside the pie.'
    }),

    // position and shape
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
                'Sets the horizontal domain of this pie trace',
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
                'Sets the vertical domain of this pie trace',
                '(in plot fraction).'
            ].join(' ')
        }
    },
    hole: {
        valType: 'number',
        role: 'style',
        min: 0,
        max: 1,
        dflt: 0,
        description: [
            'Sets the fraction of the radius to cut out of the pie.',
            'Use this to make a donut chart.'
        ].join(' ')
    },

    // ordering and direction
    sort: {
        valType: 'boolean',
        role: 'style',
        dflt: true,
        description: [
            'Determines whether or not the samples are reordered',
            'from largest to smallest.'
        ].join(' ')
    },
    direction: {
        /**
         * there are two common conventions, both of which place the first
         * (largest, if sorted) slice with its left edge at 12 o'clock but
         * succeeding slices follow either cw or ccw from there.
         *
         * see http://visage.co/data-visualization-101-pie-charts/
         */
        valType: 'enumerated',
        values: ['clockwise', 'counterclockwise'],
        role: 'style',
        dflt: 'counterclockwise',
        description: [
            'Specifies the direction at which succeeding sample lines follow',
            'one another.'
        ].join(' ')
    },
    rotation: {
        valType: 'number',
        role: 'style',
        min: -360,
        max: 360,
        dflt: 0,
        description: [
            'Instead of the first slice starting at 12 o\'clock,',
            'rotate to some other angle.'
        ].join(' ')
    },

    pull: {
        valType: 'number',
        role: 'style',
        min: 0,
        max: 1,
        dflt: 0,
        arrayOk: true,
        description: [
            'Sets the fraction of larger radius to pull the sectors',
            'out from the center. This can be a constant',
            'to pull all slices apart from each other equally',
            'or an array to highlight one or more slices.'
        ].join(' ')
    }
};
