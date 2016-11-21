/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var configMaker = require('./config');
var modelMaker = require('./model');
var overlay = require('./overlay');
var vertexShaderSource = require('./shaderVertex');
var fragmentShaderSource = require('./shaderFragment');
var utils = require('./utils');
var regl = require('regl');
var unitToColor = require('./colors');
var lineLayerMaker = require('./lineLayer');

module.exports = function plot(root, data) {

    var canvasGL = document.createElement('canvas');
    canvasGL.setAttribute('style', 'position: absolute; margin: 32px;overflow: visible;');
    root.appendChild(canvasGL);

    var svgRoot = d3.select(root).append('svg')
        .style('position', 'absolute')
        .style('margin', '32px')
        .style('overflow', 'visible')
        .node();

    var model = modelMaker(data);
    var config = configMaker(model);
    var ol = overlay(svgRoot, config);

    var lineLayer = lineLayerMaker(regl, utils, canvasGL, vertexShaderSource, fragmentShaderSource, config, model, ol, unitToColor);

    lineLayer.render(false);
};