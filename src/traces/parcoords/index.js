/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Parcoords = {};

Parcoords.attributes = require('./attributes');
Parcoords.supplyDefaults = require('./defaults');
Parcoords.supplyLayoutDefaults = require('./layout_defaults');
Parcoords.layoutAttributes = require('./layout_attributes');
Parcoords.calc = require('./calc');
Parcoords.plot = require('./plot');
Parcoords.style = require('./style');
Parcoords.styleOne = require('./style_one');

Parcoords.moduleType = 'trace';
Parcoords.name = 'parcoords';
Parcoords.basePlotModule = require('./base_plot');
Parcoords.categories = ['pie', 'showLegend'];
Parcoords.meta = {
    description: [
        'A data visualized by the sectors of the pie is set in `values`.',
        'The sector labels are set in `labels`.',
        'The sector colors are set in `marker.colors`'
    ].join(' ')
};

module.exports = Parcoords;
