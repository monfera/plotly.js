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
var unitToColor = require('./colors');
var lineLayerMaker = require('./lineLayer');
var d3 = require('d3');

module.exports = function plot(root, data) {

    var model = modelMaker(data);
    var config = configMaker(model);

    var contextCanvasGL = document.createElement('canvas');
    contextCanvasGL.setAttribute('style', 'position: absolute; padding: ' + config.padding + 'px;overflow: visible;');
    root.appendChild(contextCanvasGL);

    var focusCanvasGL = document.createElement('canvas');
    focusCanvasGL.setAttribute('style', 'position: absolute; padding: ' + config.padding + 'px;overflow: visible;');
    root.appendChild(focusCanvasGL);

    var ol = overlay(root, model, config);
    var contextLineLayer = lineLayerMaker(contextCanvasGL, config, model, unitToColor, true);
    var focusLineLayer = lineLayerMaker(focusCanvasGL, config, model, unitToColor, false);
    var variableViews = ol.enterOverlayPanels(focusLineLayer.approach, focusLineLayer.render, contextLineLayer.render, focusLineLayer.setColorDomain);
};