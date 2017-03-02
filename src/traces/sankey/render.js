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
var d3sankey = require('./sankey');


function keyFun(d) {return d.key;}

function repeat(d) {return [d];}

function visible(dimension) {return !('visible' in dimension) || dimension.visible;}

function unwrap(d) {
    return d[0]; // plotly data structure convention
}

function viewModel(layout, d, i) {
    var trace = unwrap(d).trace,
        domain = trace.domain,
        nodes = trace.nodes,
        links = trace.links;

    var width = layout.width * (domain.x[1] - domain.x[0]);
    var height = layout.height * (domain.y[1] - domain.y[0]);

    var pad = layout.margin || {l: 80, r: 80, t: 100, b: 80};

    var sankey = d3sankey()
        .size([width, height])
        .nodeWidth(50)
        .nodePadding(5)
        .nodes(nodes.map(function(d) {return {name: d.label};}))
        .links(links.map(function(d) {
            return {
                source: d.source,
                target: d.target,
                value: d.value
            };
        }))
        .layout(50);

    return {
        key: i,
        translateX: domain.x[0] * width,
        translateY: layout.height - domain.y[1] * layout.height,
        pad: pad,
        width: width,
        height: height,
        nodes: nodes,
        links: links,
        sankey: sankey
    };
}

module.exports = function(svg, styledData, layout, callbacks) {

    var dragInProgress = false;
    var hovered = false;

    var vm = styledData
        .filter(function(d) {return unwrap(d).trace.visible;})
        .map(viewModel.bind(0, layout));
    
    var sankeyControlOverlay = svg.selectAll('.sankey')
        .data(vm, keyFun);

    sankeyControlOverlay.exit().remove();

    sankeyControlOverlay.enter()
        .append('g')
        .classed('sankey', true)
        .attr('overflow', 'visible')
        .style('box-sizing', 'content-box')
        .style('position', 'absolute')
        .style('left', 0)
        .style('overflow', 'visible')
        .style('shape-rendering', 'crispEdges')
        .style('pointer-events', 'auto');

    sankeyControlOverlay
        .attr('width', function(d) {return d.width + d.pad.l + d.pad.r;})
        .attr('height', function(d) {return d.height + d.pad.t + d.pad.b;})
        .attr('transform', function(d) {
            return 'translate(' + d.translateX + ',' + d.translateY + ')';
        });

    var sankeyControlView = sankeyControlOverlay.selectAll('.sankeyControlView')
        .data(repeat, keyFun);

    sankeyControlView.enter()
        .append('g')
        .classed('sankeyControlView', true)
        .style('box-sizing', 'content-box');

    sankeyControlView
        .attr('transform', function(d) {return 'translate(' + d.pad.l + ',' + d.pad.t + ')';});

    var realSankey = sankeyControlView.selectAll('.realSankey')
        .data(repeat, keyFun);

    realSankey.enter()
        .append('g')
        .classed('realSankey', true)
        .style('shape-rendering', 'geometricPrecision');

    var sankeyLinks = realSankey.selectAll('.sankeyLinks')
        .data(repeat, keyFun);

    sankeyLinks.enter()
        .append('g')
        .classed('sankeyLinks', true)
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-opacity', 0.25);

    var sankeyLink = sankeyLinks.selectAll('.sankeyPath')
        .data(function(d) {
            return d.sankey.links().map(function(l) {
                return {
                    link: l,
                    sankey: d.sankey
                };
            });
        });

    sankeyLink.enter()
        .append('path')
        .classed('sankeyPath', true)
        .on('mouseover', function(d) {
            if(!dragInProgress) {
                callbacks.linkEvents.hover.bind(this)(d);
                hovered = [this, d];
            }})
        .on('mouseout', function(d) {
            if(!dragInProgress) {
                callbacks.linkEvents.unhover.bind(this)(d);
                hovered = false;
            }})
        .on('click', function(d) {
            if(hovered) {
                callbacks.linkEvents.unhover.bind(this)(d);
                hovered = false;
            }
            if(!dragInProgress) {
                callbacks.linkEvents.select.bind(this)(d);
            }})
        .append('title')
        .text(function(d) {
            return d.link.source.name + '⟿' + d.link.target.name + ' : ' + d.link.value;
        });

    function linkPath(d) {
        return d.sankey.link()(d.link);
    }

    sankeyLink
        .attr('d', linkPath)
        .style('stroke-width', function(d) {return Math.max(1, d.link.dy);});

    var sankeyNodes = realSankey.selectAll('.sankeyNodes')
        .data(repeat, keyFun);

    sankeyNodes.enter()
        .append('g')
        .style('shape-rendering', 'crispEdges')
        .classed('sankeyNodes', true);

    var sankeyNode = sankeyNodes.selectAll('.sankeyPath')
        .data(function(d) {
            return d.sankey.nodes().map(function(l) {
                return {
                    node: l,
                    sankey: d.sankey,
                    model: d
                };
            });
        });

    sankeyNode.enter()
        .append('g')
        .classed('sankeyNode', true)
        .call(d3.behavior.drag()
            .origin(function(d) {return d.node;})
            .on('dragstart', function(d) {
                d.node.dragStartY = d3.event.y;
                this.parentNode.appendChild(this);
                dragInProgress = true;
                if(hovered) {
                    callbacks.nodeEvents.unhover.bind(hovered[0])(hovered[1]);
                    hovered = false;
                }
            })
            .on('drag', function(d) {
                    d.node.y = Math.max(0, Math.min(d.model.height - d.node.dy, d3.event.y));
                    d3.select(this).style('transform', 'translate(' + d.node.x + 'px,' + d.node.y + 'px)');
                    d.sankey.relayout();
                    sankeyLink.attr('d', linkPath);
                }
            )
            .on('dragend', function() {
                dragInProgress = false;
            }));

    sankeyNode
        .style('transform', function(d) {return 'translate(' + (Math.floor(d.node.x) - 0.5) + 'px, ' + (Math.floor(d.node.y) + 0.5) + 'px)';});

    var nodeRect = sankeyNode.selectAll('.nodeRect')
        .data(repeat);

    var colorer = d3.scale.category20();

    nodeRect.enter()
        .append('rect')
        .classed('nodeRect', true)
        .style('shape-rendering', 'crispEdges')
        .style('fill', function(d) {return colorer(d.sankey.nodes().indexOf(d.node));})
        .style('stroke', 'black')
        .style('stroke-opacity', 1)
        .style('stroke-width', 0.5)
        .on('mouseover', function(d) {
            if(!dragInProgress) {
                callbacks.nodeEvents.hover.bind(this)(d);
                hovered = [this, d];
            }})
        .on('mouseout', function(d) {
            if(!dragInProgress) {
                callbacks.nodeEvents.unhover.bind(this)(d);
                hovered = false;
            }})
        .on('click', function(d) {
            if(hovered) {
                callbacks.nodeEvents.unhover.bind(this)(d);
                hovered = false;
            }
            if(!dragInProgress) {
                callbacks.nodeEvents.select.bind(this)(d);
            }})
        .append('title')
        .text(function(d) {
            return [
                d.node.name,
                'in: ' + d.node.targetLinks.length,
                'out: ' + d.node.sourceLinks.length,
                'value: ' + d.node.value
            ].join('\n');
        });

    nodeRect
        .attr('width', function(d) {return Math.ceil(d.node.dx + 0.5);})
        .attr('height', function(d) {return Math.ceil(d.node.dy - 0.5);});

    var nodeLabel = sankeyNode.selectAll('.nodeLabel')
        .data(repeat);

    nodeLabel.enter()
        .append('text')
        .classed('nodeLabel', true);

    nodeLabel
        .attr('x', function(d) {return d.node.dx + c.nodeTextOffsetX;})
        .attr('y', function(d) {return d.node.dy / 2;})
        .text(function(d) {return d.node.name;})
        .attr('alignment-baseline', 'middle')
        .style('font-family', 'sans-serif')
        .style('font-size', '10px');
};
