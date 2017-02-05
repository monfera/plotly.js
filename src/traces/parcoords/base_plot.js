/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plots = require('../../plots/plots');
var parcoordsPlot = require('./plot');
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');

exports.name = 'parcoords';

exports.plot = function(gd) {
    var calcData = Plots.getSubplotCalcData(gd.calcdata, 'parcoords', void(0));

    if(calcData.length) parcoordsPlot(gd, calcData);
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    oldFullLayout._paperdiv.selectAll('.parcoords-line-layers').remove();
    oldFullLayout._paperdiv.selectAll('.parcoords-line-layers').remove();
    oldFullLayout._paperdiv.selectAll('.parcoords').remove();
    oldFullLayout._paperdiv.selectAll('.parcoords').remove();
};

exports.toSVG = function(gd) {

    var imageRoot = gd._fullLayout._glimages;
    var root = d3.selectAll('.svg-container');
    var canvases = root.filter(function(d, i) {return i === 0;})
        .selectAll('.parcoords-lines.context, .parcoords-lines.focus');

    function canvasToImage() {
        var canvas = this;
        var rect = canvas.getBoundingClientRect();
        var parentRect = canvas.parentElement.getBoundingClientRect();
        var canvasStyle = window.getComputedStyle(canvas, null);
        var canvasContentOriginX = parseFloat(canvasStyle.getPropertyValue('padding-left')) + (rect.left - parentRect.left);
        var canvasContentOriginY = parseFloat(canvasStyle.getPropertyValue('padding-top')) + (rect.top - parentRect.top);
        var imageData = canvas.toDataURL('image/png');
        var image = gd._fullLayout._glimages.append('svg:image');
        image.attr({
            xmlns: xmlnsNamespaces.svg,
            'xlink:href': imageData,
            x: canvasContentOriginX,
            y: canvasContentOriginY,
            width: parseFloat(canvasStyle.getPropertyValue('width')),
            height: parseFloat(canvasStyle.getPropertyValue('height')),
            preserveAspectRatio: 'none'
        });
    }

    var canvases = document.querySelectorAll('.parcoords-lines.context, .parcoords-lines.focus');

    canvases.forEach(canvasToImage);
};
