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

    variables: {
        valType: 'data_array',
        description: 'The variables (dimensions) of the parallel coordinates chart.'
    },

    settings: {
        valType: 'any',
        description: 'The styling, geometry and performance related settings of the parallel coordinates chart. (Will be broken down to smaller chunks.)'
    },

    lines: {
        valType: 'any',
        description: 'The styling, geometry and performance related settings of the parallel coordinates chart. (Will be broken down to smaller chunks.)'
    },

    filterbar: {
        visiblewidth: {
            valType: 'number',
            dflt: 4,
            min: 2,
            max: 20,
            role: 'style',
            description: 'Visible width of the filter bar.'
        },
        capturewidth: {
            valType: 'number',
            dflt: 20,
            min: 2,
            max: 50,
            role: 'style',
            description: 'Mouse capture width of the filter bar.'
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
