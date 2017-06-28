/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Plots = require('../../plots/plots');
var tablePlot = require('./plot');
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');
var c = require('./constants');

exports.name = 'table';

exports.attr = 'type';

exports.plot = function(gd) {
    var calcData = Plots.getSubplotCalcData(gd.calcdata, 'table', 'table');
    if(calcData.length) tablePlot(gd, calcData);
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var hadTable = (oldFullLayout._has && oldFullLayout._has('table'));
    var hasTable = (newFullLayout._has && newFullLayout._has('table'));

    if(hadTable && !hasTable) {
        oldFullLayout._paperdiv.selectAll('.table-line-layers').remove();
        oldFullLayout._paperdiv.selectAll('.table-line-layers').remove();
        oldFullLayout._paperdiv.selectAll('.table').remove();
        oldFullLayout._paperdiv.selectAll('.table').remove();
        oldFullLayout._glimages.selectAll('*').remove();
    }
};

exports.toSVG = function(gd) {

    var imageRoot = gd._fullLayout._glimages;
    var root = d3.selectAll('.svg-container');
    var canvases = root.filter(function(d, i) {return i === root.size() - 1;})
        .selectAll('.table-lines.context, .table-lines.focus');

    function canvasToImage(d) {
        var canvas = this;
        var imageData = canvas.toDataURL('image/png');
        var image = imageRoot.append('svg:image');
        var size = gd._fullLayout._size;
        var domain = gd._fullData[d.model.key].domain;

        image.attr({
            xmlns: xmlnsNamespaces.svg,
            'xlink:href': imageData,
            x: size.l + size.w * domain.x[0] - c.overdrag,
            y: size.t + size.h * (1 - domain.y[1]),
            width: (domain.x[1] - domain.x[0]) * size.w + 2 * c.overdrag,
            height: (domain.y[1] - domain.y[0]) * size.h,
            preserveAspectRatio: 'none'
        });
    }

    canvases.each(canvasToImage);

    // Chrome / Safari bug workaround - browser apparently loses connection to the defined pattern
    // Without the workaround, these browsers 'lose' the filter brush styling (color etc.) after a snapshot
    // on a subsequent interaction.
    // Firefox works fine without this workaround
    window.setTimeout(function() {
        d3.selectAll('#filterBarPattern')
            .attr('id', 'filterBarPattern');
    }, 60);
};
