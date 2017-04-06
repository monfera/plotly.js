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
var tinycolor = require('tinycolor2');
var Color = require('../../components/color');
var d3sankey = require('./sankey');
var d3Force = require('d3-force');


function keyFun(d) {return d.key;}

function repeat(d) {return [d];}

function visible(dimension) {return !('visible' in dimension) || dimension.visible;}

function unwrap(d) {
    return d[0]; // plotly data structure convention
}

function persistOriginalX(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].originalX = nodes[i].x;
    }
}

function toForceFormat(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].y = nodes[i].y + nodes[i].dy / 2;
    }
}

function toSankeyFormat(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].y = nodes[i].y - nodes[i].dy / 2;
    }
}

function viewModel(layout, d, i) {
    var trace = unwrap(d).trace,
        domain = trace.domain,
        nodes = trace.nodes,
        links = trace.links;

    var width = layout.width * (domain.x[1] - domain.x[0]);
    var height = layout.height * (domain.y[1] - domain.y[0]);

    var sankey = d3sankey()
        .size(c.vertical ? [height, width]: [width, height])
        .nodeWidth(c.nodeWidth)
        .nodePadding(c.nodePadding)
        .nodes(nodes)
        .links(links)
        .layout(c.sankeyIterations);
    toForceFormat(nodes);
    return {
        key: i,
        width: width,
        height: height,
        translateX: domain.x[0] * width + layout.margin.l,
        translateY: layout.height - domain.y[1] * layout.height + layout.margin.t,
        dragParallel: c.vertical ? width : height,
        dragPerpendicular: c.vertical ? height : width,
        nodes: nodes,
        links: links,
        sankey: sankey
    };
}

function constrainDraggedItem(d) {
    d.lastDraggedX = d.x
    d.lastDraggedY = d.y
}

module.exports = function(svg, styledData, layout, callbacks) {

    var dragInProgress = false;
    var hovered = false;

    function attachPointerEvents(selection, eventSet) {
        selection
            .on('mouseover', function (d) {
                if (!dragInProgress) {
                    eventSet.hover(this, d);
                    hovered = [this, d];
                }
            })
            .on('mouseout', function (d) {
                if (!dragInProgress) {
                    eventSet.unhover(this, d);
                    hovered = false;
                }
            })
            .on('click', function (d) {
                if (hovered) {
                    eventSet.unhover(this, d);
                    hovered = false;
                }
                if (!dragInProgress) {
                    eventSet.select(this, d);
                }
            });
    }

    function linkPath(d) {

        var nodes = d.sankey.nodes();
        toSankeyFormat(nodes);
        var result = d.sankey.link()(d.link);
        toForceFormat(nodes);
        return result;
    }

    var sankey = svg.selectAll('.sankey')
        .data(
            styledData
                .filter(function(d) {return unwrap(d).trace.visible;})
                .map(viewModel.bind(0, layout)),
            keyFun
        );

    sankey.exit().remove();

    sankey.enter()
        .append('g')
        .classed('sankey', true)
        .attr('overflow', 'visible')
        .style('box-sizing', 'content-box')
        .style('position', 'absolute')
        .style('left', 0)
        .style('overflow', 'visible')
        .style('shape-rendering', 'geometricPrecision')
        .style('pointer-events', 'auto')
        .style('box-sizing', 'content-box');

    sankey
        .attr('transform', function(d) {
            return 'translate(' + d.translateX + ',' + d.translateY + ')';
        });

    var sankeyLinks = sankey.selectAll('.sankeyLinks')
        .data(repeat, keyFun);

    sankeyLinks.enter()
        .append('g')
        .classed('sankeyLinks', true)
        .style('transform', c.vertical ? 'matrix(0,1,1,0,0,0)' : 'matrix(1,0,0,1,0,0)')
        .style('fill', 'none');

    var sankeyLink = sankeyLinks.selectAll('.sankeyPath')
        .data(function(d) {
            return d.sankey.links().map(function(l) {
                var tc = tinycolor(l.color);
                return {
                    link: l,
                    tinyColorHue: Color.tinyRGB(tc),
                    tinyColorAlpha: tc.getAlpha(),
                    sankey: d.sankey
                };
            });
        });

    sankeyLink.enter()
        .append('path')
        .classed('sankeyPath', true)
        .call(attachPointerEvents, callbacks.linkEvents);

    sankeyLink
        .attr('d', linkPath)
        .style('stroke', function(d) {return d.tinyColorHue;})
        .style('stroke-opacity', function(d) {return d.tinyColorAlpha;})
        .style('stroke-width', function(d) {return Math.max(1, d.link.dy);});

    var sankeyNodes = sankey.selectAll('.sankeyNodes')
        .data(repeat, keyFun);

    sankeyNodes.enter()
        .append('g')
        .each(function(d) {

            var things = d.nodes;

            var width = d.width,
                height = d.height;

            var msStopSimulation = 10000;

            var x = d3.scale.linear().range([0, width]);
            var y = d3.scale.linear().range([0, height]);

            function constrain() {
                for(var i = 0; i < things.length; i++) {
                    var d = things[i];
                    if(d === dragInProgress) { // constrain to dragging
                        d.x = d.lastDraggedX;
                        d.y = d.lastDraggedY;
                    } else {
                        d.vy = Math.min(y(1) - d.dy / 2, Math.max(y(0) + d.dy / 2, d.y)) - d.y; // constrain to extent
                        d.vx = (d.originalX - Math.round(d.x)) / Math.max(1, ((d.dy / 2)* (d.dy / 2) / 10000)); // constrain to 1D
                    }
                }
            }

            var forceLayout = d3Force.forceSimulation(things)
                .alphaDecay(0)
                //.velocityDecay(0.3)
                .force('constrain', constrain)
                .force('collide', d3Force.forceCollide()
                    .radius(function(d) {return d.dy / 2 + c.nodePadding / 2 - 1;})
                    .strength(0.3)
                    .iterations(10))
                .on('tick', updatePositionsOnTick);

        })
        .style('shape-rendering', 'crispEdges')
        .classed('sankeyNodes', true);

    function positionSankeyNode(sankeyNode) {
        sankeyNode
            .style('transform', c.vertical ?
                function(d) {return 'translate(' + (Math.floor(d.node.y - d.node.dy / 2) - 0.5) + 'px, ' + (Math.floor(d.node.x) + 0.5) + 'px)';} :
                function(d) {return 'translate(' + (Math.floor(d.node.x) - 0.5) + 'px, ' + (Math.floor(d.node.y - d.node.dy / 2) + 0.5) + 'px)';})
    }

    function updatePositionsOnTick() {
        sankeyLink.attr('d', linkPath);
        sankeyNode.call(positionSankeyNode);
    }

    var sankeyNode = sankeyNodes.selectAll('.sankeyPath')
        .data(function(d) {
            var nodes = d.sankey.nodes();
            persistOriginalX(nodes);
            return d.sankey.nodes().map(function(n) {
                var tc = tinycolor(n.color);
                return {
                    node: n,
                    tinyColorHue: Color.tinyRGB(tc),
                    tinyColorAlpha: tc.getAlpha(),
                    sankey: d.sankey,
                    model: d
                };
            });
        });

    sankeyNode.enter()
        .append('g')
        .classed('sankeyNode', true)
        .call(d3.behavior.drag()
            .origin(function(d) {return c.vertical ? {x: d.node.y, y: d.node.x} : d.node;})
            .on('dragstart', function(d) {
                this.parentNode.appendChild(this);
                dragInProgress = d.node;
                constrainDraggedItem(d.node);
                if(hovered) {
                    callbacks.nodeEvents.unhover.apply(0, hovered);
                    hovered = false;
                }
            })
            .on('drag', function(d) {
                var x = c.vertical ? d3.event.y : d3.event.x;
                var y = c.vertical ? d3.event.x : d3.event.y;
                d.node.x = Math.max(0, Math.min(d.model.dragPerpendicular - d.node.dx, x));
                d.node.y = y // Math.max(d.node.dy / 2, Math.min(d.model.dragParallel - d.node.dy / 2, y));
                constrainDraggedItem(d.node);
                d.sankey.relayout();
            })
            .on('dragend', function() {
                dragInProgress = false;
            }));

    var nodeRect = sankeyNode.selectAll('.nodeRect')
        .data(repeat);

    nodeRect.enter()
        .append('rect')
        .classed('nodeRect', true)
        .style('shape-rendering', 'crispEdges')
        .style('stroke-width', 0.5)
        .call(Color.stroke, 'rgba(0, 0, 0, 1)')
        .call(attachPointerEvents, callbacks.nodeEvents);

    nodeRect // ceil, +/-0.5 and crispEdges is wizardry for consistent border width on all 4 sides
        .style('fill', function(d) {return d.tinyColorHue;})
        .style('fill-opacity', function(d) {return d.tinyColorAlpha;})
        .attr(c.vertical ? 'height' : 'width', function(d) {return Math.ceil(d.node.dx + 0.5);})
        .attr(c.vertical ? 'width' : 'height', function(d) {return Math.ceil(d.node.dy - 0.5);});

    var nodeLabel = sankeyNode.selectAll('.nodeLabel')
        .data(repeat);

    nodeLabel.enter()
        .append('text')
        .classed('nodeLabel', true);

    nodeLabel
        .attr('x', function(d) {return c.vertical ? d.node.dy / 2 : d.node.dx + c.nodeTextOffset;})
        .attr('y', function(d) {return c.vertical ? d.node.dx / 2 : d.node.dy / 2;})
        .text(function(d) {return d.node.label;})
        .attr('alignment-baseline', 'middle')
        .attr('text-anchor', c.vertical ? 'middle' : 'start')
        .style('font-family', 'sans-serif')
        .style('font-size', '10px');
};
