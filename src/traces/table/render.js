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
        columnWidths = trace.width;

    var colCount = labels.length;

    var groupWidth = Math.floor(width * (domain.x[1] - domain.x[0]));
    var groupHeight = Math.floor(layout.height * (domain.y[1] - domain.y[0]));

    columnWidths = labels.map(function(d, i) {
        //if(!Array.isArray(columnWidths)) debugger
        return Array.isArray(columnWidths) ?
            columnWidths[Math.min(i, columnWidths.length - 1)] :
            isFinite(columnWidths) && columnWidths !== null ?
                columnWidths :
                groupWidth / (colCount - 1); // todo revise -1 which comes from pre-column era
    });

    var pad = layout.margin || {l: 80, r: 80, t: 100, b: 80};
    var rowContentWidth = groupWidth;
    var rowHeight = groupHeight;

    return {
        key: i,
        colCount: colCount,
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
        values: values,
        columnWidths: columnWidths
    };
}

var rowPitch = 20;
var cellPad = 3;

function viewModel(model) {

    var width = model.width;
    var height = model.height;

    var newXScale = function (d) {
        return d.parent.dimensions.reduce(function(prev, next) {return next.xIndex < d.xIndex ? prev + next.columnWidth : prev}, 0);
    }

    var viewModel = {
        key: model.key,
        model: model
    };

    var uniqueKeys = {};

    viewModel.dimensions = model.values.map(function(dimension, i) {
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
            newXScale: newXScale,
            x: undefined, // see below
            unitScale: unitScale(height, c.verticalPadding),
            filter: [0, 1],
            parent: viewModel,
            valueFormat:  model.valueFormat[i],
            model: model,
            columnWidth: model.columnWidths[i]
        };
    });

    viewModel.dimensions.forEach(function(dim) {
        dim.x = newXScale(dim);
    });
    return viewModel;
}

function gridPick(spec, col, row) {
    if(Array.isArray(spec)) {
        const colorColumn = spec[Math.min(col, spec.length - 1)];
        if(Array.isArray(colorColumn)) {
            return colorColumn[Math.min(row, colorColumn.length - 1)];
        } else {
            return colorColumn;
        }
    } else {
        return spec;
    }
}

module.exports = function(root, svg, styledData, layout, callbacks) {

    var domainBrushing = false;
    var linePickActive = true;

    var vm = styledData
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
        .style('pointer-events', 'auto');

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
        .attr('transform', function(d) {return 'translate(' + d.newXScale(d) + ', 0)';});

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
                        dd.x = d === dd ? dd.x : dd.newXScale(dd);
                    });

                yColumn.filter(function(dd) {return Math.abs(d.xIndex - dd.xIndex) !== 0;})
                    .attr('transform', function(d) {return 'translate(' + d.newXScale(d) + ', 0)';});
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
                d.x = d.newXScale(d);
                d3.select(this)
                    .attr('transform', function(d) {return 'translate(' + d.x + ', 0)';});
                linePickActive = true;

                if(callbacks && callbacks.columnMoved) {
                    callbacks.columnMoved(p.key, p.dimensions.map(function(dd) {return dd.crossfilterDimensionIndex;}));
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
        .attr('text-anchor', 'start')
        .style('cursor', 'ew-resize')
        //.style('user-select', 'none')
        //.style('pointer-events', 'auto');

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
        .attr('transform', function(d, i) {return 'translate(' + 0 + ',' + i * rowPitch + ')';})
        .each(function(d, i) {
            var spec = d.model.font;
            var col = d.dimension.crossfilterDimensionIndex;
            var font = {
                size: gridPick(spec.size, col, i),
                color: gridPick(spec.color, col, i),
                family: gridPick(spec.family, col, i)
            };
            Drawing.font(d3.select(this), font);
        });

    var cellText = columnCell.selectAll('.cellText')
        .data(repeat, keyFun);

    cellText.enter()
        .append('text')
        .classed('cellText', true)
        .attr('text-anchor', 'start');

    cellText
        .text(function(d) {
            return d.dimension.valueFormat ? d3.format(d.dimension.valueFormat)(d.value) : d.value;
        });

    var cellRect = columnCell.selectAll('.cellRect')
        .data(repeat, keyFun);

    cellRect.enter()
        .append('rect')
        .attr('fill-opacity', 0.2)
        .classed('cellRect', true);

    cellRect
        .attr('width', function(d) {return d.dimension.columnWidth})
        .attr('height', rowPitch)
        .attr('transform', function(d) {return 'translate(' + 0 + ' ' + (-(rowPitch - cellPad)) + ')'})
        .attr('stroke', 'grey')
        .attr('stroke-width', 1);
};
