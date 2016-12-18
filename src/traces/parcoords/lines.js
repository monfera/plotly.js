/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createREGL = require('regl');
var ndarray = require('ndarray');
var glslify = require('glslify');
var vertexShaderSource = glslify('./shaders/vertex.glsl');
var fragmentShaderSource = glslify('./shaders/fragment.glsl');

var filterEpsilon = 1e-3; // don't change; otherwise filter may lose lines on domain boundaries

var gpuDimensionCount = 64;
var vec4NumberCount = 4;
var mat4RowCount = 4;
var mat4NumberCount = vec4NumberCount * mat4RowCount;
var gpuMatrixCount = gpuDimensionCount / mat4NumberCount;
var sectionVertexCount = 2;
var panelVariableCount = 2;
var domainBoundsCount = 2;

var dummyPixel = new Uint8Array(4);
function ensureDraw(regl) {
    regl.read({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        data: dummyPixel
    });
}

function clear(regl, x, y, width, height) {
    var gl = regl._gl;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, width, height);
    regl.clear({color: [0, 0, 0, 0], depth: 1}); // clearing is done in scissored panel only
}

function renderBlock(regl, glAes, renderState, blockLineCount, sampleCount, item) {

    var blockNumber = 0;
    var rafKey = item.key;

    if(!renderState.drawCompleted) {
        ensureDraw(regl);
        renderState.drawCompleted = true;
    }

    function render(blockNumber) {

        var count;

        count = Math.min(blockLineCount, sampleCount - blockNumber * blockLineCount);

        item.offset = sectionVertexCount * blockNumber * blockLineCount;
        item.count = sectionVertexCount * count;
        if(blockNumber === 0) {
            window.cancelAnimationFrame(renderState.currentRafs[rafKey]); // stop drawing possibly stale glyphs before clearing
            clear(regl, item.scissorX, 0, item.scissorWidth, item.viewBoxSize[1]);
        }

        if(renderState.clearOnly) {
            return;
        }

        glAes(item);
        blockNumber++;

        if(blockNumber * blockLineCount + count < sampleCount) {
            renderState.currentRafs[rafKey] = window.requestAnimationFrame(function() {
                render(blockNumber);
            });
        }

        renderState.drawCompleted = false;
    }

    render(blockNumber);
}

function palette(unitToColor, context, lines_contextcolor, lines_contextopacity) {
    var result = [];
    for(var j = 0; j < 256; j++) {
        var c = unitToColor(j / 255);
        result.push((context ? lines_contextcolor : c).concat([context ? lines_contextopacity : 255]));
    }

    return result;
}

function makePoints(sampleCount, dimensionCount, dimensions, color) {

    var points = [];
    for(var j = 0; j < sampleCount; j++) {
        for(var i = 0; i < gpuDimensionCount; i++) {
            points.push(i < dimensionCount ? dimensions[i].paddedUnitValues[j] : 0.5);
        }
    }

    return points;
}

function makeVecAttr(sampleCount, points, vecIndex) {

    var i, j, k;
    var pointPairs = [];

    for(j = 0; j < sampleCount; j++) {
        for (k = 0; k < sectionVertexCount; k++) {
            for (i = 0; i < vec4NumberCount; i++) {
                pointPairs.push(points[j * gpuDimensionCount + vecIndex * vec4NumberCount + i]);
                if(vecIndex * vec4NumberCount + i === 0 && k % 2 === 0) {
                    pointPairs[pointPairs.length - 1] *= -1;
                }
            }
        }
    }

    return pointPairs;
}

function makeAttributes(sampleCount, points) {

    var vecIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    var vectors = vecIndices.map(function(vecIndex) {return makeVecAttr(sampleCount, points, vecIndex);});

    var attributes = {};
    vectors.forEach(function(v, vecIndex) {
        attributes['p' + vecIndex.toString(16)] = v;
    })

    return attributes;
}

function makeDummyFilters() {
    var l = -filterEpsilon;
    var h = 1 + filterEpsilon;
    var lows = [l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l];
    var highs = [h,h,h,h,h,h,h,h,h,h,h,h,h,h,h,h];
    return {
        loA: lows,
        loB: lows,
        loC: lows,
        loD: lows,
        hiA: highs,
        hiB: highs,
        hiC: highs,
        hiD: highs
    }
}

function makeFilters(dimensions) {

    var lims = [0, 1].map(function() {return [0, 1, 2, 3].map(function() {return new Float32Array(16);});});

    function valid(i, offset) {
        return i + offset < dimensions.length;
    }

    function orig(i) {
        var index = dimensions.map(function(v) {return v.originalXIndex;}).indexOf(i);
        return dimensions[index];
    }

    for(var loHi = 0; loHi < domainBoundsCount; loHi++) {
        for(var mat = 0; mat < gpuMatrixCount; mat++) {
            for(var d = 0; d < mat4NumberCount; d++) {
                lims[loHi][mat][d] = (valid(d, mat4NumberCount * mat) ? orig(d + mat4NumberCount * mat).filter[loHi] : loHi) + (2 * loHi - 1) * filterEpsilon;
            }
        }
    }

    return {
        loA: lims[0][0],
        loB: lims[0][1],
        loC: lims[0][2],
        loD: lims[0][3],
        hiA: lims[1][0],
        hiB: lims[1][1],
        hiC: lims[1][2],
        hiD: lims[1][3]
    }
}


module.exports = function(canvasGL, lines, canvasWidth, canvasHeight, dimensions, unitToColor, context) {

    var renderState = {
        currentRafs: {},
        drawCompleted: true,
        clearOnly: false
    };

    var dimensionCount = dimensions.length;
    var sampleCount = dimensions[0].values.length;

    var focusAlphaBlending = context; // controlConfig.focusAlphaBlending;

    var canvasPanelSizeY = canvasHeight;

    var color = lines.color;
    var overdrag = lines.canvasOverdrag;

    var panelCount = dimensionCount - 1;

    var points = makePoints(sampleCount, dimensionCount, dimensions, color);
    var attributes = makeAttributes(sampleCount, points);

    var regl = createREGL({
        canvas: canvasGL,
        attributes: {
            preserveDrawingBuffer: true
        }
    });

    var paletteTexture = regl.texture({
        shape: [256, 1],
        format: 'rgba',
        type: 'uint8',
        mag: 'nearest',
        min: 'nearest',
        data: palette(unitToColor, context, lines.contextcolor, lines.contextopacity)
    });

    var glAes = regl({

        profile: false,

        blend: {
            enable: focusAlphaBlending,
            func: {
                srcRGB: 'src alpha',
                dstRGB: 'one minus src alpha',
                srcAlpha: 1,
                dstAlpha: 1 // 'one minus src alpha'
            },
            equation: {
                rgb: 'add',
                alpha: 'add'
            },
            color: [0, 0, 0, 0]
        },

        depth: {
            enable: !focusAlphaBlending,
            mask: true,
            func: 'less',
            range: [0, 1]
        },

        // for polygons
        cull: {
            enable: true,
            face: 'back'
        },

        scissor: {
            enable: true,
            box: {
                x: regl.prop('scissorX'),
                y: 0,
                width: regl.prop('scissorWidth'),
                height: canvasPanelSizeY
            }
        },

        dither: false,

        vert: vertexShaderSource,

        frag: fragmentShaderSource,

        primitive: 'lines',
        lineWidth: 1,
        attributes: attributes,
        uniforms: {
            //resolution: regl.prop('resolution'),
            viewBoxPosition: regl.prop('viewBoxPosition'),
            viewBoxSize: regl.prop('viewBoxSize'),
            dim1A: regl.prop('dim1A'),
            dim2A: regl.prop('dim2A'),
            dim1B: regl.prop('dim1B'),
            dim2B: regl.prop('dim2B'),
            dim1C: regl.prop('dim1C'),
            dim2C: regl.prop('dim2C'),
            dim1D: regl.prop('dim1D'),
            dim2D: regl.prop('dim2D'),
            loA: regl.prop('loA'),
            hiA: regl.prop('hiA'),
            loB: regl.prop('loB'),
            hiB: regl.prop('hiB'),
            loC: regl.prop('loC'),
            hiC: regl.prop('hiC'),
            loD: regl.prop('loD'),
            hiD: regl.prop('hiD'),
            palette: paletteTexture,
            colorClamp: [0, 1],
            scatter: regl.prop('scatter')
        },
        offset: regl.prop('offset'),
        count: regl.prop('count')
    });

    var previousAxisOrder = [];

    var dims = [0, 1].map(function() {return [0, 1, 2, 3].map(function() {return new Float32Array(16);});});

    function renderGLParcoords(dimensionViews, setChanged, clearOnly) {

        var I;

        var leftmostIndex, rightmostIndex, lowestX = Infinity, highestX = -Infinity;
        for(I = 0; I < panelCount; I++) {
            if(dimensionViews[I].canvasX > highestX) {
                highestX = dimensionViews[I].canvasX;
                rightmostIndex = I;
            }
            if(dimensionViews[I].canvasX < lowestX) {
                lowestX = dimensionViews[I].canvasX;
                leftmostIndex = I;
            }
        }

        var filters = context ? makeDummyFilters(dimensionViews) : makeFilters(dimensionViews);

        var itemInvariant = Object.assign(
            {},
            filters,
            {
                resolution: [canvasWidth, canvasHeight]
            });

        function makeItem(i, ii, x, panelSizeX, originalXIndex, scatter) {
            var leftRight = [i, ii], index;

            // set panel left, right variables
            for(var lr = 0; lr < panelVariableCount; lr++) {
                index = leftRight[lr];
                for(var mat = 0; mat < gpuMatrixCount; mat++) {
                    for(var d = 0; d < mat4NumberCount; d++) {
                        dims[lr][mat][d] = d + mat4NumberCount * mat === index ? 1 : 0;
                    }
                }
            }

            return {
                key: originalXIndex,
                viewBoxPosition: [x + overdrag, 0],
                viewBoxSize: [panelSizeX, canvasPanelSizeY],

                dim1A: dims[0][0],
                dim1B: dims[0][1],
                dim1C: dims[0][2],
                dim1D: dims[0][3],
                dim2A: dims[1][0],
                dim2B: dims[1][1],
                dim2C: dims[1][2],
                dim2D: dims[1][3],

                scatter: scatter || 0,
                scissorX: I === leftmostIndex ? 0 : x + overdrag,
                scissorWidth: I === rightmostIndex ? 2 * panelSizeX : panelSizeX + 1 + (I === leftmostIndex ? x + overdrag : 0)
            };
        }

        regl({
            uniforms: {
                resolution: [canvasWidth, canvasHeight]
            }
        })(function() {
            for(I = 0; I < panelCount; I++) {
                var dimensionView = dimensionViews[I];
                var i = dimensionView.originalXIndex;
                var x = dimensionView.canvasX;
                var nextDim = dimensionViews[(I + 1) % dimensionCount];
                var ii = nextDim.originalXIndex;
                var panelSizeX = nextDim.canvasX - x;
                if(setChanged || !previousAxisOrder[i] || previousAxisOrder[i][0] !== x || previousAxisOrder[i][1] !== nextDim.canvasX) {


                    previousAxisOrder[i] = [x, nextDim.canvasX];
                    var item = Object.assign(
                        {},
                        filters,
                        makeItem(i, ii, x, panelSizeX, dimensionView.originalXIndex, dimensionView.scatter)
                    );
                    renderState.clearOnly = clearOnly;
                    renderBlock(regl, glAes, renderState, setChanged ? lines.blocklinecount : sampleCount, sampleCount, item);


                }
            }

        });

    }

    return {
        render: renderGLParcoords,
        destroy: regl.destroy
    };
};
