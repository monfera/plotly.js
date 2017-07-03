/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttributes = require('../../components/colorscale/color_attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');
var colorscales = require('../../components/colorscale/scales');
var annAttrs = require('../../components/annotations/attributes');
var fontAttrs = require('../../plots/font_attributes');

var extendDeep = require('../../lib/extend').extendDeep;
var extendFlat = require('../../lib/extend').extendFlat;

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
                'Sets the horizontal domain of this `table` trace',
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
                'Sets the vertical domain of this `table` trace',
                '(in plot fraction).'
            ].join(' ')
        }
    },

    line: {
        width: {
            valType: 'number',
            arrayOk: true,
            role: 'style'
        },
        color: {
            valType: 'color',
            arrayOk: true,
            role: 'style'
        }
    },

    font: {
        family: {
            valType: 'string',
            arrayOk: true,
            role: 'style',
            noBlank: true,
            strict: true,
            description: [
                'HTML font family - the typeface that will be applied by the web browser.',
                'The web browser will only be able to apply a font if it is available on the system',
                'which it operates. Provide multiple font families, separated by commas, to indicate',
                'the preference in which to apply fonts if they aren\'t available on the system.',
                'The plotly service (at https://plot.ly or on-premise) generates images on a server,',
                'where only a select number of',
                'fonts are installed and supported.',
                'These include *Arial*, *Balto*, *Courier New*, *Droid Sans*,, *Droid Serif*,',
                '*Droid Sans Mono*, *Gravitas One*, *Old Standard TT*, *Open Sans*, *Overpass*,',
                '*PT Sans Narrow*, *Raleway*, *Times New Roman*.'
            ].join(' ')
        },
        size: {
            valType: 'number',
            arrayOk: true,
            role: 'style'
        },
        color: {
            valType: 'color',
            arrayOk: true,
            role: 'style'
        }
    },

    labelfont: extendFlat({}, fontAttrs, {
        description: 'Sets the font for the `dimension` labels.'
    }),

    values: {
        valType: 'data_array',
        role: 'info',
        dflt: [],
        description: [
            'Dimension values. `values[n]` represents the value of the `n`th point in the dataset,',
            'therefore the `values` vector for all dimensions must be the same (longer vectors',
            'will be truncated). Each value must be a finite number.'
        ].join(' ')
    },

    labels: {
        valType: 'data_array',
        role: 'info',
        dflt: [],
        description: 'The shown name of the columns.'
    },

    valueformat: {
        valType: 'data_array',
        role: 'info',
        dflt: [],
        description: [
            'Sets the cell value formatting rule using d3 formatting mini-language',
            'which is similar to those of Python. See',
            'https://github.com/d3/d3-format/blob/master/README.md#locale_format'
        ]
    },

    width: {
        valType: 'number',
        arrayOk: true,
        dflt: null,
        role: 'style'
    },

    align: extendFlat({}, annAttrs.align, {arrayOk: true}),
    valign: extendFlat({}, annAttrs.valign, {arrayOk: true}),

    fill: extendFlat({},

        // the default autocolorscale is set to Viridis - autocolorscale therefore defaults to false too,
        // to avoid being overridden by the blue-white-red autocolor palette
        extendDeep(
            {},
            colorAttributes('fill'),
            {
                color: extendDeep(
                    {},
                    colorAttributes('fill').color
                ),
                colorscale: extendDeep(
                    {},
                    colorAttributes('line').colorscale,
                    {dflt: colorscales.Viridis}
                ),
                autocolorscale: extendDeep(
                    {},
                    colorAttributes('fill').autocolorscale,
                    {
                        dflt: false,
                        description: [
                            'Has an effect only if line.color` is set to a numerical array.',
                            'Determines whether the colorscale is a default palette (`autocolorscale: true`)',
                            'or the palette determined by `line.colorscale`.',
                            'In case `colorscale` is unspecified or `autocolorscale` is true, the default ',
                            'palette will be chosen according to whether numbers in the `color` array are',
                            'all positive, all negative or mixed.',
                            'The default value is false, so that `table` colorscale can default to `Viridis`.'
                        ].join(' ')
                    }
                )

            }
        ),

        {
            showscale: {
                valType: 'boolean',
                role: 'info',
                dflt: false,
                description: [
                    'Has an effect only if `line.color` is set to a numerical array.',
                    'Determines whether or not a colorbar is displayed.'
                ].join(' ')
            },
            colorbar: colorbarAttrs
        }
    )
};
