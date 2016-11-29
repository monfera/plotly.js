var controlConfig = require('./controlConfig');
var utils = require('./utils');
var createREGL = require('regl');

var depthLimitEpsilon = 1e-6; // don't change; otherwise near/far plane lines are lost
var filterEpsilon = 1e-3; // don't change; otherwise filter may lose lines on domain boundaries

var dummyPixel = new Uint8Array(4)
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

        item.offset = 2 * blockNumber * blockLineCount;
        item.count = 2 * count;
        if(blockNumber === 0) { // the +1 avoids the minor vertical residue on axes
            window.cancelAnimationFrame(renderState.currentRafs[rafKey]); // stop drawing possibly stale glyphs before clearing
            clear(regl, item.scissorX, 0, item.scissorWidth + 1, item.viewBoxSize[1]);
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

module.exports = function(canvasGL, vertexShaderSource, fragmentShaderSource, config, model, unitToColor, context) {

    var renderState = {
        currentRafs: {},
        drawCompleted: true
    };

    var data = model.data;
    var variableCount = model.variableCount;
    var sampleCount = model.sampleCount;
    var domainToUnitScales = model.domainToUnitScales;

    var alphaBlending = context; // controlConfig.alphaBlending;

    var width = config.width;
    var height = config.height;
    var panelSizeY = config.panelSizeY;
    var coloringVariable = config.coloringVariable;
    var colorScale = config.colorScale;
    var depthVariable = config.depthVariable;
    var canvasPixelRatio = config.canvasPixelRatio;

    var canvasWidth = width * canvasPixelRatio;
    var canvasHeight = height * canvasPixelRatio;
    var canvasPanelSizeY = panelSizeY * canvasPixelRatio;

    canvasGL.setAttribute('width', canvasWidth);
    canvasGL.setAttribute('height', canvasHeight);
    canvasGL.style.width = width + 'px';
    canvasGL.style.height = height + 'px';

    var coloringVariableUnitScale = domainToUnitScales[coloringVariable];
    var depthUnitScale = domainToUnitScales[depthVariable];

    function colorProjection(j) {
        return colorScale(coloringVariableUnitScale(data.get(coloringVariable, j)));
    }

    var gpuVariableCount = 48 // don't change this

    function paddedUnit(d) {
        var unitPad = controlConfig.verticalPadding / panelSizeY;
        return unitPad + d * (1 - 2 * unitPad);
    }

    var points = []
    for(var j = 0; j < sampleCount; j++)
        for(var i = 0; i < gpuVariableCount; i++)
            points.push(i < variableCount ? paddedUnit(domainToUnitScales[i](data.get(i, j))) : 0.5);

    var pointPairs = [];

    for (j = 0; j < sampleCount; j++) {
        for (i = 0; i < gpuVariableCount; i++) {
            pointPairs.push(points[j * gpuVariableCount + i]);
        }
        for (i = 0; i < gpuVariableCount; i++) {
            pointPairs.push(points[j * gpuVariableCount + i]);
        }
    }

    var leftOrRight = utils.range(sampleCount * 2).map(function(d) {return d % 2});
    var depth = utils.range(sampleCount * 2).map(function(d) {
        return Math.max(depthLimitEpsilon, Math.min(1 - depthLimitEpsilon,
            depthUnitScale(data.get(depthVariable, Math.round((d - d % 2) / 2)))));
    })

    var color = new Float32Array(sampleCount * 2 * 4);
    for(j = 0; j < sampleCount; j++) {
        var prominence = colorProjection(j);
        for(var k = 0; k < 2; k++) {
            var c = unitToColor(1 - prominence);
            color[j * 2 * 4 + k * 4]     = alphaBlending ? 0 : c[0] / 255;
            color[j * 2 * 4 + k * 4 + 1] = alphaBlending ? 0 : c[1] / 255;
            color[j * 2 * 4 + k * 4 + 2] = alphaBlending ? 0 : c[2] / 255;
            color[j * 2 * 4 + k * 4 + 3] = alphaBlending ? .01 : 1;
        }
    }

    var positionStride = gpuVariableCount * 4;

    var shownVariableCount = variableCount;
    var shownPanelCount = shownVariableCount - 1;

    var variableViews;

    function render(newVariableViews, setChanged) {
        variableViews = newVariableViews;
        renderGLParcoords(setChanged, variableViews);
    }

    var regl = createREGL({
        canvas: canvasGL,
        attributes: {
            preserveDrawingBuffer: true
        }
    });

    var positionBuffer = regl.buffer(new Float32Array(pointPairs));

    var attributes = {
        color: {
            stride: 16,
            offset: 0,
            buffer: color
        },
        x: {
            size: 1,
            buffer: regl.buffer(leftOrRight)
        },
        depth: {
            size: 1,
            buffer: regl.buffer(depth)
        }};

    for(var i = 0; i < 12; i++) {
        attributes['p' + i.toString(16)] = {
            offset: i * 16,
            stride: positionStride,
            buffer: positionBuffer
        };
    }

    var glAes = regl({

        profile: false,

        blend: {
            enable: alphaBlending,
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
            enable: !alphaBlending,
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
            resolution: regl.prop('resolution'),
            viewBoxPosition: regl.prop('viewBoxPosition'),
            viewBoxSize: regl.prop('viewBoxSize'),
            var1A: regl.prop('var1A'),
            var2A: regl.prop('var2A'),
            var1B: regl.prop('var1B'),
            var2B: regl.prop('var2B'),
            var1C: regl.prop('var1C'),
            var2C: regl.prop('var2C'),
            loA: regl.prop('loA'),
            hiA: regl.prop('hiA'),
            loB: regl.prop('loB'),
            hiB: regl.prop('hiB'),
            loC: regl.prop('loC'),
            hiC: regl.prop('hiC')
        },
        offset: regl.prop('offset'),
        count: regl.prop('count')
    });

    function approach(column) {
        //utils.ndarrayOrder(, column.index);
        //console.log('Approached ', JSON.stringify(column.name));
    }

    var previousAxisOrder = [];

    function valid(i, offset) {
        return i < shownVariableCount && i + offset < variableViews.length;
    }

    function renderGLParcoords(setChanged, variableViews) {

        var I;

        function orig(i) {
            var index = variableViews.map(function(v) {return v.originalXIndex;}).indexOf(i);
            return variableViews[index];
        }

        var leftmostIndex, rightmostIndex, lowestX = Infinity, highestX = -Infinity;
        for(I = 0; I < shownPanelCount; I++) {
            if(variableViews[I].x > highestX) {
                highestX = variableViews[I].x;
                rightmostIndex = I;
            }
            if(variableViews[I].x < lowestX) {
                lowestX = variableViews[I].x;
                leftmostIndex = I;
            }
        }

        for(I = 0; I < shownPanelCount; I++) {
            var variableView = variableViews[I];
            var i = variableView.originalXIndex;
            var x = variableView.x * config.canvasPixelRatio;
            var nextVar = variableViews[(I + 1) % shownVariableCount];
            var ii = nextVar.originalXIndex;
            var panelSizeX = nextVar.x * config.canvasPixelRatio - x;
            if(setChanged || !previousAxisOrder[i] || previousAxisOrder[i][0] !== x || previousAxisOrder[i][1] !== nextVar.x) {
                previousAxisOrder[i] = [x, nextVar.x];
                var item = {
                    key: variableView.originalXIndex,
                    resolution: [canvasWidth, canvasHeight],
                    viewBoxPosition: [x, 0],
                    viewBoxSize: [panelSizeX, canvasPanelSizeY],
                    var1A: utils.range(16).map(function(d) {return d === i  ? 1 : 0}),
                    var2A: utils.range(16).map(function(d) {return d === ii ? 1 : 0}),
                    var1B: utils.range(16).map(function(d) {return d + 16 === i  ? 1 : 0}),
                    var2B: utils.range(16).map(function(d) {return d + 16 === ii ? 1 : 0}),
                    var1C: utils.range(16).map(function(d) {return d + 32 === i  ? 1 : 0}),
                    var2C: utils.range(16).map(function(d) {return d + 32 === ii ? 1 : 0}),
                    loA: utils.range(16).map(function(i) {return paddedUnit(1 - (valid(i, 0)  ? orig(i     ).filter[1] : 1)) - filterEpsilon}),
                    hiA: utils.range(16).map(function(i) {return paddedUnit(1 - (valid(i, 0)  ? orig(i     ).filter[0] : 0)) + filterEpsilon}),
                    loB: utils.range(16).map(function(i) {return paddedUnit(1 - (valid(i, 16) ? orig(i + 16).filter[1] : 1)) - filterEpsilon}),
                    hiB: utils.range(16).map(function(i) {return paddedUnit(1 - (valid(i, 16) ? orig(i + 16).filter[0] : 0)) + filterEpsilon}),
                    loC: utils.range(16).map(function(i) {return paddedUnit(1 - (valid(i, 32) ? orig(i + 32).filter[1] : 1)) - filterEpsilon}),
                    hiC: utils.range(16).map(function(i) {return paddedUnit(1 - (valid(i, 32) ? orig(i + 32).filter[0] : 0)) + filterEpsilon}),
                    scissorX: I === leftmostIndex ? 0 : x,
                    scissorWidth: I === rightmostIndex ? width : panelSizeX + 1 + (I === leftmostIndex ? x : 0)
                };
                renderBlock(regl, glAes, renderState, setChanged ? config.blockLineCount : sampleCount, sampleCount, item);
            }
        }
    }

    function destroy() {
        regl.destroy();
    }

    return {
        approach: approach,
        render: render,
        destroy: destroy
    };
}
