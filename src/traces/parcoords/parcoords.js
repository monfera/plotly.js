/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var modelMaker = require('./model');
var configMaker = require('./config');
var overlay = require('./overlay');

module.exports = function plot(root, data) {

    var model = modelMaker(data);
    var config = configMaker(model);

    var ol = overlay(root, model, config);
    var variableViews = ol.enterOverlayPanels();
};