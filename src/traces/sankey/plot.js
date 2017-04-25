/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var render = require('./render');
var Fx = require('../../plots/cartesian/graph_interact');
var d3 = require('d3');
var Color = require('../../components/color');

function renderableValuePresent(d) {return d !== '';}

function ownTrace(selection, d) {
    return selection.filter(function(s) {return s.key === d.traceId;});
}

function makeTranslucent(element, alpha) {
    d3.select(element)
        .select('path')
        .style('fill-opacity', alpha);
    d3.select(element)
        .select('rect')
        .style('fill-opacity', alpha);
}

function makeTextContrasty(element, hue) {
    d3.select(element)
        .select('text.name')
        .style('fill', /*Color.contrast(hue, -20, 20)*/'black');
}

function relatedLinks(d) {
    return function(l) {
        return d.node.sourceLinks.indexOf(l.link) !== -1 ||  d.node.targetLinks.indexOf(l.link) !== -1;
    };
}

function relatedNodes(l) {
    return function(d) {
        return d.node.sourceLinks.indexOf(l.link) !== -1 ||  d.node.targetLinks.indexOf(l.link) !== -1;
    };
}

function nodeHoveredStyle(sankeyNode, d, sankey) {

    sankeyNode.select('.nodeRect').style('stroke-width', 1);

    if(d && sankey) {
        ownTrace(sankey, d)
            .selectAll('.sankeyLink')
            .filter(relatedLinks(d))
            .call(linkHoveredStyle);
    }
}

function nodeNonHoveredStyle(sankeyNode, d, sankey) {

    sankeyNode.select('.nodeRect').style('stroke-width', 0.5);

    if(d && sankey) {
        ownTrace(sankey, d)
            .selectAll('.sankeyLink')
            .filter(relatedLinks(d))
            .call(linkNonHoveredStyle);
    }
}

function linkHoveredStyle(sankeyLink, d, sankey) {

    sankeyLink.style('fill-opacity', 0.4);

    if(d && sankey) {
        ownTrace(sankey, d)
            .selectAll('.sankeyNode')
            .filter(relatedNodes(d))
            .call(nodeHoveredStyle);
    }
}

function linkNonHoveredStyle(sankeyLink, d, sankey) {

    sankeyLink.style('fill-opacity', function(d) {return d.tinyColorAlpha;});

    if(d && sankey) {
        ownTrace(sankey, d)
            .selectAll('.sankeyNode')
            .filter(relatedNodes(d))
            .call(nodeNonHoveredStyle);
    }
}

var log = false

module.exports = function plot(gd, calcData) {

    var fullLayout = gd._fullLayout;
    var svg = fullLayout._paper;

    var size = fullLayout._size;

    var linkSelect = function(element, d) {
        if(log) console.log('select link', d.link);
        gd._hoverdata = [d.link];
        gd._hoverdata.trace = calcData.trace;
        Fx.click(gd, { target: true });
    };

    var linkHover = function(element, d, sankey) {

            d3.select(element).call(linkHoveredStyle, d, sankey);
            if(log) console.log('hover link', d.link);

            Fx.hover(gd, d.link, 'sankey');
    };

    var linkHoverFollow = function(element, d) {


        var followMouse = gd.data[0].followmouse;

        var boundingBox = !followMouse && element.getBoundingClientRect();
        var hoverCenterX = followMouse ? d3.event.x : boundingBox.left + boundingBox.width / 2;
        var hoverCenterY = followMouse ? d3.event.y : boundingBox.top + boundingBox.height / 2;

        var tooltip = Fx.loneHover({
            x: hoverCenterX + window.scrollX,
            y: hoverCenterY + window.scrollY,
            name: d3.format(d.valueFormat)(d.link.value) + d.valueSuffix,
            text: [
                d.link.label,
                ['Source:', d.link.source.label].join(' '),
                ['Target:', d.link.target.label].join(' ')
            ].filter(renderableValuePresent).join('<br>'),
            color: Color.addOpacity(d.tinyColorHue, 1),
            idealAlign: d3.event.x < hoverCenterX ? 'right' : 'left'
        }, {
            container: fullLayout._hoverlayer.node(),
            outerContainer: fullLayout._paper.node()
        });

        makeTranslucent(tooltip, 0.65);
        makeTextContrasty(tooltip, d.tinyColorHue);
    };

    var linkUnhover = function(element, d, sankey) {
        d3.select(element).call(linkNonHoveredStyle, d, sankey);
        if(log) console.log('unhover link', d.link);
        gd.emit('plotly_unhover', {
            points: [d.link]
        });

        Fx.loneUnhover(fullLayout._hoverlayer.node());
    };

    var nodeSelect = function(element, d, sankey) {
        if(log) console.log('select node', d.node);
        gd._hoverdata = [d.node];
        gd._hoverdata.trace = calcData.trace;
        d3.select(element).call(linkNonHoveredStyle, d, sankey);
        d3.select(element).call(nodeNonHoveredStyle, d, sankey);
        Fx.click(gd, { target: true });
    };

    var repositioned = function(d, nodes) {
        if(log) console.log('repositioned node', nodes);
        var n, nOrig;
        var names = gd.data[0].nodes.map(function(nn) {return nn.label;});
        for(var i = 0; i < nodes.length; i++) {
            n = nodes[i];
            nOrig = gd.data[d.traceId].nodes[names.indexOf(n.label)];
            nOrig.parallel = (n.x - n.dx / 2) / n.width;
            nOrig.perpendicular = (n.y - n.dy / 2) / n.height;
        }
    };

    var nodeHover = function(element, d, sankey) {

        if(log) console.log('hover node', d.node);

        d3.select(element).call(nodeHoveredStyle, d, sankey);

        Fx.hover(gd, d.node, 'sankey');
    };


    var nodeHoverFollow = function(element, d) {

        var nodeRect = d3.select(element).select('.nodeRect');

        var followMouse = gd.data[0].followmouse;

        var boundingBox = nodeRect.node().getBoundingClientRect();
        var hoverCenterX0 = boundingBox.left - 2;
        var hoverCenterX1 = boundingBox.right + 2;
        var hoverCenterY = followMouse ? d3.event.y : boundingBox.top + boundingBox.height / 4;

        var tooltip = Fx.loneHover({
            x0: hoverCenterX0 + window.scrollX,
            x1: hoverCenterX1 + window.scrollX,
            y: hoverCenterY + window.scrollY,
            name: d3.format(d.valueFormat)(d.node.value) + d.valueSuffix,
            text: [
                d.node.label,
                ['Incoming flow count:', d.node.targetLinks.length].join(' '),
                ['Outgoing flow count:', d.node.sourceLinks.length].join(' ')
            ].filter(renderableValuePresent).join('<br>'),
            color: d.tinyColorHue,
            idealAlign: 'left'
        }, {
            container: fullLayout._hoverlayer.node(),
            outerContainer: fullLayout._paper.node()
        });

        makeTranslucent(tooltip, 0.85);
        makeTextContrasty(tooltip, d.tinyColorHue);
    };

    var nodeUnhover = function(element, d, sankey) {

        d3.select(element).call(nodeNonHoveredStyle, d, sankey);
        if(log) console.log('unhover node', d.node);
        gd.emit('plotly_unhover', {
            points: [d.node]
        });

        Fx.loneUnhover(fullLayout._hoverlayer.node());
    };

    render(
        svg,
        calcData,
        {
            width: size.w,
            height: size.h,
            margin: {
                t: size.t,
                r: size.r,
                b: size.b,
                l: size.l
            }
        },
        {
            linkEvents: {
                hover: linkHover,
                follow: linkHoverFollow,
                unhover: linkUnhover,
                select: linkSelect
            },
            nodeEvents: {
                hover: nodeHover,
                follow: nodeHoverFollow,
                unhover: nodeUnhover,
                select: nodeSelect,
                repositioned: repositioned
            }
        }
    );
};
