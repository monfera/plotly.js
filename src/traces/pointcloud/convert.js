/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createpointcloud = require('gl-pointcloud2d');
var isNumeric = require('fast-isnumeric');

var str2RGBArray = require('../../lib/str2rgbarray');
var truncate = require('../../lib/float32_truncate');
var getTraceColor = require('../scatter/get_trace_color');

var AXES = ['xaxis', 'yaxis'];

function Pointcloud(scene, uid) {
    this.scene = scene;
    this.uid = uid;

    this.pickXData = [];
    this.pickYData = [];
    this.xData = [];
    this.yData = [];
    this.textLabels = [];
    this.color = 'rgb(0, 0, 0)';
    this.name = '';
    this.hoverinfo = 'all';

    this.idToIndex = [];
    this.bounds = [0, 0, 0, 0];

    this.pointcloudOptions = {
        positions: new Float32Array(0),
        size: 12,
        color: [0, 0, 0, 1],
        borderSize: 1,
        borderColor: [0, 0, 0, 1]
    };
    this.pointcloud = createpointcloud(scene.glplot, this.pointcloudOptions);
    this.pointcloud._trace = this; // scene2d requires this prop
}

var proto = Pointcloud.prototype;

proto.handlePick = function(pickResult) {

    var index = this.idToIndex[pickResult.pointId];

    return {
        trace: this,
        dataCoord: pickResult.dataCoord,
        traceCoord: [
            this.pickXData[index],
            this.pickYData[index]
        ],
        textLabel: Array.isArray(this.textLabels) ?
            this.textLabels[index] :
            this.textLabels,
        color: Array.isArray(this.color) ?
            this.color[index] :
            this.color,
        name: this.name,
        hoverinfo: this.hoverinfo
    };
};

proto.update = function(options) {

    this.textLabels = options.text;
    this.name = options.name;
    this.hoverinfo = options.hoverinfo;
    this.bounds = [Infinity, Infinity, -Infinity, -Infinity];

    this.updateFast(options);

    this.color = getTraceColor(options, {});
};

proto.updateFast = function(options) {
    var x = this.xData = this.pickXData = options.x;
    var y = this.yData = this.pickYData = options.y;

    var len = x.length,
        idToIndex = new Array(len),
        positions = new Float32Array(2 * len),
        bounds = this.bounds,
        pId = 0,
        ptr = 0;

    var xx, yy;

    // TODO add 'very fast' mode that bypasses this loop
    // TODO bypass this on modebar +/- zoom
    for(var i = 0; i < len; ++i) {
        xx = x[i];
        yy = y[i];

        // check for isNaN is faster but doesn't skip over nulls
        if(!isNumeric(xx) || !isNumeric(yy)) continue;

        idToIndex[pId++] = i;

        positions[ptr++] = xx;
        positions[ptr++] = yy;

        bounds[0] = Math.min(bounds[0], xx);
        bounds[1] = Math.min(bounds[1], yy);
        bounds[2] = Math.max(bounds[2], xx);
        bounds[3] = Math.max(bounds[3], yy);
    }

    positions = truncate(positions, ptr);
    this.idToIndex = idToIndex;

    var markerSize;

    this.pointcloudOptions.positions = positions;

    var markerColor = str2RGBArray(options.marker.color),
        borderColor = str2RGBArray(options.marker.line.color),
        opacity = options.opacity * options.marker.opacity;

    markerColor[3] *= opacity;
    this.pointcloudOptions.color = markerColor;

    borderColor[3] *= opacity;
    this.pointcloudOptions.borderColor = borderColor;

    markerSize = options.marker.size;
    this.pointcloudOptions.size = markerSize;
    this.pointcloudOptions.borderSize = options.marker.line.width;

    this.pointcloud.update(this.pointcloudOptions);

    // add item for autorange routine
    this.expandAxesFast(bounds, markerSize);
};

proto.expandAxesFast = function(bounds, markerSize) {
    var pad = markerSize || 10;
    var ax, min, max;

    for(var i = 0; i < 2; i++) {
        ax = this.scene[AXES[i]];

        min = ax._min;
        if(!min) min = [];
        min.push({ val: bounds[i], pad: pad });

        max = ax._max;
        if(!max) max = [];
        max.push({ val: bounds[i + 2], pad: pad });
    }
};

proto.dispose = function() {
    this.pointcloud.dispose();
};

function createPointcloud(scene, data) {
    var plot = new Pointcloud(scene, data.uid);
    plot.update(data);
    return plot;
}

module.exports = createPointcloud;
