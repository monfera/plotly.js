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
var vertexShaderSource = require('./shaderVertex');
var fragmentShaderSource = require('./shaderFragment');
var unitToColor = require('./colors');
var lineLayerMaker = require('./lineLayer');

module.exports = function plot(root, data) {

    var model = modelMaker(data);
    var config = configMaker(model);

    var canvasGL = document.createElement('canvas');
    canvasGL.setAttribute('style', 'position: absolute; padding: ' + config.padding + 'px;overflow: visible;');
    root.appendChild(canvasGL);

    var ol = overlay(root, model, config);

    var lineLayer = lineLayerMaker(canvasGL, vertexShaderSource, fragmentShaderSource, config, model, ol, unitToColor);

    lineLayer.render(false);
};