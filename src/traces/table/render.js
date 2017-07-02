/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var c = require('./constants');
var d3 = require('d3');
var Drawing = require('../../components/drawing');

function keyFun(d) {return d.key;}

function repeat(d) {return [d];}

function visible(dimension) {return !('visible' in dimension) || dimension.visible;}

function unitScale(height, padding) {return d3.scale.linear().range([height - padding, padding]);}

function unwrap(d) {
    return d[0]; // plotly data structure convention
}

function model(layout, d, i) {
    var cd0 = unwrap(d),
        trace = cd0.trace,
        domain = trace.domain,
        width = layout.width,
        font = trace.font,
        labelFont = trace.labelfont,
        labels = trace.labels,
        valueFormat = trace.valueformat,
        values = trace.values,
        visible = trace.visible;

    var groupWidth = Math.floor(width * (domain.x[1] - domain.x[0]));
    var groupHeight = Math.floor(layout.height * (domain.y[1] - domain.y[0]));

    var pad = layout.margin || {l: 80, r: 80, t: 100, b: 80};
    var rowContentWidth = groupWidth;
    var rowHeight = groupHeight;

    return {
        key: i,
        colCount: visible.filter(function identity(bool) {return bool;}).length,
        tickDistance: c.tickDistance,
        font: font,
        labelFont: labelFont,
        translateX: domain.x[0] * width,
        translateY: layout.height - domain.y[1] * layout.height,
        pad: pad,
        width: rowContentWidth,
        height: rowHeight,
        labels: labels,
        valueFormat: valueFormat,
        visible: visible,
        values: values
    };
}

function viewModel(model) {

    var width = model.width;
    var height = model.height;

    var xScale = function(d) {return width * d / Math.max(1, model.colCount - 1);};

    var viewModel = {
        key: model.key,
        xScale: xScale,
        model: model
    };

    var uniqueKeys = {};

    viewModel.dimensions = model.visible.filter(function identity(bool) {return bool;}).map(function(dimension, i) {
        var label = model.labels[i];
        var foundKey = uniqueKeys[label];
        uniqueKeys[label] = (foundKey || 0) + 1;
        var key = label + (foundKey ? '__' + foundKey : '');
        return {
            key: key,
            label: label,
            xIndex: i,
            crossfilterDimensionIndex: i,
            height: height,
            values: model.values[i].slice(0, 10),
            xScale: xScale,
            x: xScale(i),
            unitScale: unitScale(height, c.verticalPadding),
            filter: [0, 1],
            parent: viewModel,
            valueFormat:  model.valueFormat[i],
            model: model
        };
    });

    return viewModel;
}

module.exports = function(root, svg, styledData, layout, callbacks) {

    var domainBrushing = false;
    var linePickActive = true;

    var vm = styledData
        .filter(function(d) { return unwrap(d).trace.visible; })
        .map(model.bind(0, layout))
        .map(viewModel);

    svg.style('background', 'rgba(255, 255, 255, 0)');
    var tableControlOverlay = svg.selectAll('.table')
        .data(vm, keyFun);

    tableControlOverlay.exit().remove();

    tableControlOverlay.enter()
        .append('g')
        .classed('table', true)
        .attr('overflow', 'visible')
        .style('box-sizing', 'content-box')
        .style('position', 'absolute')
        .style('left', 0)
        .style('overflow', 'visible')
        .style('shape-rendering', 'crispEdges')
        .style('pointer-events', 'none');

    tableControlOverlay
        .attr('width', function(d) {return d.model.width + d.model.pad.l + d.model.pad.r;})
        .attr('height', function(d) {return d.model.height + d.model.pad.t + d.model.pad.b;})
        .attr('transform', function(d) {
            return 'translate(' + d.model.translateX + ',' + d.model.translateY + ')';
        });

    var tableControlView = tableControlOverlay.selectAll('.tableControlView')
        .data(repeat, keyFun);

    tableControlView.enter()
        .append('g')
        .classed('tableControlView', true)
        .style('box-sizing', 'content-box');

    tableControlView
        .attr('transform', function(d) {return 'translate(' + d.model.pad.l + ',' + d.model.pad.t + ')';});

    var yColumn = tableControlView.selectAll('.yColumn')
        .data(function(vm) {return vm.dimensions;}, keyFun);

    yColumn.enter()
        .append('g')
        .classed('yColumn', true);

    yColumn
        .attr('transform', function(d) {return 'translate(' + d.xScale(d.xIndex) + ', 0)';});

    yColumn
        .call(d3.behavior.drag()
            .origin(function(d) {return d;})
            .on('drag', function(d) {
                var p = d.parent;
                linePickActive = false;
                if(domainBrushing) {
                    return;
                }
                d.x = Math.max(-c.overdrag, Math.min(d.model.width + c.overdrag, d3.event.x));
                yColumn
                    .sort(function(a, b) {return a.x - b.x;})
                    .each(function(dd, i) {
                        dd.xIndex = i;
                        dd.x = d === dd ? dd.x : dd.xScale(dd.xIndex);
                    });

                yColumn.filter(function(dd) {return Math.abs(d.xIndex - dd.xIndex) !== 0;})
                    .attr('transform', function(d) {return 'translate(' + d.xScale(d.xIndex) + ', 0)';});
                d3.select(this).attr('transform', 'translate(' + d.x + ', 0)');
                yColumn.each(function(dd, i, ii) {if(ii === d.parent.key) p.dimensions[i] = dd;});
            })
            .on('dragend', function(d) {
                var p = d.parent;
                if(domainBrushing) {
                    if(domainBrushing === 'ending') {
                        domainBrushing = false;
                    }
                    return;
                }
                d.x = d.xScale(d.xIndex);
                d3.select(this)
                    .attr('transform', function(d) {return 'translate(' + d.x + ', 0)';});
                linePickActive = true;

                if(callbacks && callbacks.columnsMoved) {
                    callbacks.columnsMoved(p.key, p.dimensions.map(function(dd) {return dd.crossfilterDimensionIndex;}));
                }
            })
        );

    yColumn.exit()
        .remove();

    var columnOverlays = yColumn.selectAll('.columnOverlays')
        .data(repeat, keyFun);

    columnOverlays.enter()
        .append('g')
        .classed('columnOverlays', true);

    columnOverlays.selectAll('.column').remove();

    var column = columnOverlays.selectAll('.column')
        .data(repeat, keyFun);

    column.enter()
        .append('g')
        .classed('column', true);

    column
        .selectAll('.domain, .tick>line')
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-opacity', 0.25)
        .attr('stroke-width', '1px');

    column
        .selectAll('text')
        .style('text-shadow', '1px 1px 1px #fff, -1px -1px 1px #fff, 1px -1px 1px #fff, -1px 1px 1px #fff')
        .style('cursor', 'default')
        .style('user-select', 'none');

    var columnHeading = columnOverlays.selectAll('.columnHeading')
        .data(repeat, keyFun);

    columnHeading.enter()
        .append('g')
        .classed('columnHeading', true);

    var columnTitle = columnHeading.selectAll('.columnTitle')
        .data(repeat, keyFun);

    columnTitle.enter()
        .append('text')
        .classed('columnTitle', true)
        .attr('text-anchor', 'end')
        .style('cursor', 'ew-resize')
        .style('user-select', 'none')
        .style('pointer-events', 'auto');

    columnTitle
        .attr('transform', 'translate(0,' + -c.columnTitleOffset + ')')
        .text(function(d) {return d.label;})
        .each(function(d) {Drawing.font(columnTitle, d.model.labelFont);});

    var columnCells = columnOverlays.selectAll('.columnCells')
        .data(repeat, keyFun);

    columnCells.enter()
        .append('g')
        .classed('columnCells', true);

    columnCells.each(function(d) {Drawing.font(d3.select(this), d.font);});

    var columnCell = columnCells.selectAll('.columnCell')
        .data(function(d) {return d.values.map(function(v, i) {return {key: i, dimension: d, model: d.model, value: v};});}, keyFun);

    columnCell.enter()
        .append('g')
        .classed('columnCell', true);

    columnCell
        .attr('transform', function(d, i) {return 'translate(' + 0 + ',' + i * 20 + ')';})
        .each(function(d, i) {
            var spec = d.model.font;
            const colspec = spec.color[Math.min(d.dimension.crossfilterDimensionIndex, spec.color.length - 1)]
            var font = {
                size: spec.size,
                color: colspec[Math.min(i, colspec.length - 1)],
                family: spec.family
            };
            Drawing.font(d3.select(this), font);
        });

    var columnCellText = columnCell.selectAll('.columnCellText')
        .data(repeat, keyFun);

    columnCellText.enter()
        .append('text')
        .classed('columnCellText', true)
        .attr('alignment-baseline', 'middle')
        .attr('text-anchor', 'end');

    columnCellText
        //.each(function(d) {Drawing.font(d3.select(this), d.model.font);})
        .text(function(d) {
            return d.dimension.valueFormat ? d3.format(d.dimension.valueFormat)(d.value) : d.value;
        });
};
