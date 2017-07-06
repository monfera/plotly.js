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
        font = trace.cells.font,
        labelFont = trace.labelfont,
        labels = trace.labels,
        valueFormat = trace.cells.format,
        values = trace.cells.values,
        prefix = trace.cells.prefix,
        suffix = trace.cells.suffix,
        columnWidths = trace.columnwidth,
        cellHeights = trace.cells.height,
        fill = trace.cells.fill,
        line = trace.cells.line,
        align = trace.cells.align,
        valign = trace.cells.valign;

    var colCount = labels.length;

    var groupWidth = Math.floor(width * (domain.x[1] - domain.x[0]));
    var groupHeight = Math.floor(layout.height * (domain.y[1] - domain.y[0]));

    columnWidths = labels.map(function(d, i) {
        return Array.isArray(columnWidths) ?
            columnWidths[Math.min(i, columnWidths.length - 1)] :
            isFinite(columnWidths) && columnWidths !== null ? columnWidths : 1;
    });

    var totalColumnWidths = columnWidths.reduce(function(p, n) {return p + n;}, 0);
    columnWidths = columnWidths.map(function(d) {return d / totalColumnWidths * groupWidth;});

    var pad = layout.margin || {l: 80, r: 80, t: 100, b: 80};
    var rowContentWidth = groupWidth;
    var rowHeight = groupHeight;

    return {
        key: i,
        colCount: colCount,
        tickDistance: c.tickDistance,
        labelFont: labelFont,
        translateX: domain.x[0] * width,
        translateY: layout.height - domain.y[1] * layout.height,
        pad: pad,
        width: rowContentWidth,
        height: rowHeight,
        labels: labels,
        columnWidths: columnWidths,

        cells: {
            values: values,
            valueFormat: valueFormat,
            prefix: prefix,
            suffix: suffix,
            cellHeights: cellHeights,
            align: align,
            valign: valign,
            font: font,
            fillColor: fill.color,
            lineWidth: line.width,
            lineColor: line.color
        }
    };
}

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

    viewModel.dimensions = model.labels.map(function(dimension, i) {
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
            newXScale: newXScale,
            x: undefined, // initialized below
            unitScale: unitScale(height, c.verticalPadding),
            filter: [0, 1],
            parent: viewModel,
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
        const column = spec[Math.min(col, spec.length - 1)];
        if(Array.isArray(column)) {
            return column[Math.min(row, column.length - 1)];
        } else {
            return column;
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
        .style('pointer-events', 'all'); // todo restore 'none'

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
                d.x = Math.max(-c.overdrag, Math.min(d.model.width + c.overdrag - d.columnWidth, d3.event.x));
                yColumn
                    .sort(function(a, b) {return a.x + a.columnWidth / 2 - b.x - b.columnWidth / 2;})
                    .each(function(dd, i) {
                        dd.xIndex = i;
                        dd.x = d === dd ? dd.x : dd.newXScale(dd);
                    });

                yColumn.filter(function(dd) {return Math.abs(d.xIndex - dd.xIndex) !== 0;})
                    .transition()
                    .ease(c.transitionEase)
                    .duration(c.transitionDuration)
                    .attr('transform', function(d) {return 'translate(' + d.newXScale(d) + ', 0)';});
                d3.select(this)
                    .transition()
                    .ease(c.transitionEase)
                    .duration(c.transitionDuration)
                    .attr('transform', 'translate(' + d.x + ', -5)');
                yColumn.each(function(dd, i, ii) {if(ii === d.parent.key) p.dimensions[i] = dd;});
                this.parentNode.appendChild(this);
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
                    .transition()
                    .ease(c.releaseTransitionEase, 1, .5)
                    .duration(c.releaseTransitionDuration)
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
        .style('user-select', 'none')
        .style('pointer-events', 'auto');

    columnTitle
        .attr('transform', 'translate(0,' + -c.columnTitleOffset + ')')
        .text(function(d) {return d.label;})
        .each(function(d) {
            Drawing.font(columnTitle, d.model.labelFont);
            d.rowPitch = gridPick(d.model.cells.cellHeights, 0, 0); // fixme generalize to rows
        });

    var columnBlock = columnOverlays.selectAll('.columnBlock')
        .data(function(d) {
            var blockDataHeader = Object.assign(
                {},
                d,
                {
                    key: 'header',
                    yOffset: 0,
                    values: [d.model.labels[d.xIndex]],
                    dragHandle: true,
                    model: Object.assign(
                        {},
                        d.model,
                        {
                            cells: {
                                values: [d.model.labels[d.xIndex]],
                                font: d.model.labelFont,
                                lineWidth: 0,
                                fillColor: 'none'
                            }
                        }
                    )
                }
            );

            var blockDataCells = Object.assign(
                {},
                d,
                {
                    key: 'cells',
                    yOffset: 40,
                    dragHandle: false,
                    values: d.model.cells.values[d.xIndex],
                    model: d.model
                }
            );
            return [blockDataHeader, blockDataCells];
        }, keyFun);

    columnBlock.enter()
        .append('g')
        .classed('columnBlock', true);

    columnBlock
        .attr('transform', function(d) {return 'translate(0 ' + d.yOffset + ')';})
        .style('cursor', function(d) {return d.dragHandle ? 'ew-resize' : null;})
        //.style('user-select', 'none')
        //.style('pointer-events', 'auto');

    var columnCells = columnBlock.selectAll('.columnCells')
        .data(repeat, keyFun);

    columnCells.enter()
        .append('g')
        .classed('columnCells', true);

    columnCells.exit()
        .remove();

    var columnCell = columnCells.selectAll('.columnCell')
        .data(function(d) {return d.values.map(function(v, i) {return {key: i, dimension: d, model: d.model, value: v};});}, keyFun);

    columnCell.enter()
        .append('g')
        .classed('columnCell', true);

    columnCell
        .attr('transform', function(d, i) {
            return 'translate(' + 0 + ',' + i * d.dimension.rowPitch + ')';
        })
        .each(function(d, i) {
            var spec = d.model.cells.font;
            var col = d.dimension.crossfilterDimensionIndex;
            var font = {
                size: gridPick(spec.size, col, i),
                color: gridPick(spec.color, col, i),
                family: gridPick(spec.family, col, i)
            };
            Drawing.font(d3.select(this), font);

            d.rowNumber = i;
            d.align = gridPick(d.model.cells.align, d.dimension.crossfilterDimensionIndex, i);
            d.valign = gridPick(d.model.cells.valign, d.dimension.crossfilterDimensionIndex, i);
            d.cellBorderWidth = gridPick(d.model.cells.lineWidth, d.dimension.crossfilterDimensionIndex, i)
            d.font = font;
        });

    var cellRect = columnCell.selectAll('.cellRect')
        .data(repeat, keyFun);

    cellRect.enter()
        .append('rect')
        .classed('cellRect', true);

    cellRect
        .attr('width', function(d) {return d.dimension.columnWidth - d.cellBorderWidth;})
        .attr('height', function(d) {return d.dimension.rowPitch - d.cellBorderWidth;})
        .attr('transform', function(d) {return 'translate(' + 0 + ' ' + (-(d.dimension.rowPitch - c.cellPad)) + ')'})
        .attr('stroke', function(d) {
            return gridPick(d.model.cells.lineColor, d.dimension.crossfilterDimensionIndex, d.rowNumber);
        })
        .attr('stroke-width', function(d) {return d.cellBorderWidth;})
        .attr('fill', function(d) {
            return gridPick(d.model.cells.fillColor, d.dimension.crossfilterDimensionIndex, d.rowNumber);
        });

    var cellLine = columnCell.selectAll('.cellLine')
        .data(repeat, keyFun);

    cellLine.enter()
        .append('path')
        .classed('cellLine', true);

    cellLine
        .attr('id', function(d) {return 'textpath' + d.dimension.xIndex;})
        .attr('d', function(d) {
            var x1 = 0;
            var x2 = d.dimension.columnWidth;
            var y = d.dimension.rowPitch;
            return d3.svg.line()([[x1, y], [x2, y]]);
        })
        .attr('transform', function(d) {return 'translate(' + 0 + ' ' + (-(d.dimension.rowPitch - c.cellPad)) + ')'});

    var cellText = columnCell.selectAll('.cellText')
        .data(repeat, keyFun);

    cellText.enter()
        .append('text')
        .classed('cellText', true);

    cellText
        .attr('dy', function(d) {
            var rowPitch = d.dimension.rowPitch;
            var fontSize = d.font.size;
            return ({
                top: -rowPitch + fontSize,
                center: -rowPitch / 2 + fontSize * 0.3 + c.cellPad / 2,
                bottom: -c.cellPad
            })[d.valign];
        })
        .each(function(d) {Drawing.font(d3.select(this), d.font);});

    var textPath = cellText.selectAll('.textPath')
        .data(repeat, keyFun);

    textPath.enter()
        .append('textPath')
        .classed('textPath', true);

    textPath
        .attr('xlink:href', function(d) {return '#textpath' + d.dimension.xIndex;})
        .attr('text-anchor', function(d) {
            return ({
                left: 'start',
                right: 'end',
                center: 'middle'
            })[d.align];
        })
        .attr('startOffset', function(d) {
            return ({
                left: c.cellPad,
                right: d.dimension.columnWidth - c.cellPad,
                center: '50%'
            })[d.align];
        })
        .text(function(d) {
            var dim = d.dimension.crossfilterDimensionIndex;
            var row = d.rowNumber;
            var prefix = gridPick(d.model.cells.prefix, dim, row) || '';
            var suffix = gridPick(d.model.cells.suffix, dim, row) || '';
            var valueFormat = gridPick(d.model.cells.valueFormat, dim, row);
            return prefix + (valueFormat ? d3.format(valueFormat)(d.value) : d.value) + suffix;
        });
};
