var utils = require('./utils');
var createREGL = require('regl');

module.exports = function(canvasGL, vertexShaderSource, fragmentShaderSource, config, model, overlay, unitToColor) {

    var data = model.data
    var variableCount = model.variableCount
    var sampleCount = model.sampleCount
    var domainToUnitScales = model.domainToUnitScales

    var width = config.width
    var height = config.height
    var panelSizeY = config.panelSizeY
    var coloringVariable = config.coloringVariable
    var colorScale = config.colorScale
    var depthVariable = config.depthVariable
    var canvasPixelRatio = config.canvasPixelRatio
    var rafWorkTime = config.rafTimeRatio * 1000 / 60
    var blockLineCount = config.blockLineCount

    var canvasWidth = width * canvasPixelRatio
    var canvasHeight = height * canvasPixelRatio
    var canvasPanelSizeY = panelSizeY * canvasPixelRatio

    canvasGL.setAttribute('width', canvasWidth)
    canvasGL.setAttribute('height', canvasHeight)
    canvasGL.style.width = width + 'px'
    canvasGL.style.height = height + 'px'

    var coloringVariableUnitScale = domainToUnitScales[coloringVariable]
    var depthUnitScale = domainToUnitScales[depthVariable]

    var colorProjection = function(j) {
        return colorScale(coloringVariableUnitScale(data.get(coloringVariable, j)))
    }

    var gpuVariableCount = 48 // don't change this

    var points = []
    for(var j = 0; j < sampleCount; j++)
        for(var i = 0; i < gpuVariableCount; i++)
            points.push(i < variableCount ? domainToUnitScales[i](data.get(i, j)) : 0)

    var pointPairs = []

    for (j = 0; j < sampleCount; j++) {
        for (i = 0; i < gpuVariableCount; i++) {
            pointPairs.push(points[j * gpuVariableCount + i])
        }
        for (i = 0; i < gpuVariableCount; i++) {
            pointPairs.push(points[j * gpuVariableCount + i])
        }
    }

    var leftOrRight = utils.range(sampleCount * 2).map(function(d) {return d % 2})
    var depth = utils.range(sampleCount * 2).map(function(d){
        return depthUnitScale(data.get(depthVariable, (d - d % 2) / 2))
    })

    var color = new Float32Array(sampleCount * 2 * 4)
    for(j = 0; j < sampleCount; j++) {
        var prominence = colorProjection(j)
        for(var k = 0; k < 2; k++) {
            var c = unitToColor(1 - prominence)
            color[j * 2 * 4 + k * 4]     = c[0] / 255
            color[j * 2 * 4 + k * 4 + 1] = c[1] / 255
            color[j * 2 * 4 + k * 4 + 2] = c[2] / 255
            color[j * 2 * 4 + k * 4 + 3] = 1
        }
    }

    var positionStride = gpuVariableCount * 4

    var shownVariableCount = variableCount;
    var shownPanelCount = shownVariableCount - 1;

    var variableViews;

    function render(update, newVariableViews, setChanged) {
        variableViews = newVariableViews;
        renderGLParcoords(update, setChanged);
    }

    var regl = createREGL({
        canvas: canvasGL,
        attributes: {
            preserveDrawingBuffer: true
        }
    })

    var gl = regl._gl;

    var renderGLParcoords = (function() {

        var positionBuffer = regl.buffer(new Float32Array(pointPairs))

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
                enable: false,
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
                enable: true,
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
        })

        var scheduled = null

        function approach(column) {
            //utils.ndarrayOrder(, column.index)
            console.log('Approached ', JSON.stringify(column.name));
        }

        var previousAxisOrder = [];

        return function(update, setChanged) {

            window.clearTimeout(scheduled)

            if(!update) {
                variableViews = overlay.enterOverlayPanels(approach, render);
            }

            var items = []

            function valid(i, offset) {
                return i < shownVariableCount && i + offset < variableViews.length
            }

            var I;

            function orig(i) {
                var index = variableViews.map(function(v) {return v.originalXIndex;}).indexOf(i);
                return variableViews[index];
            }

            var rightmostIndex, highestX = -Infinity;
            for(I = 0; I < shownPanelCount; I++) {
                if(variableViews[I].x > highestX) {
                    highestX = variableViews[I].x;
                    rightmostIndex = I;
                }
            }

            for(I = 0; I < shownPanelCount; I++) {
                var variableView = variableViews[I];
                var i = variableView.originalXIndex;
                var x = variableView.x;
                var nextVar = variableViews[(I + 1) % shownVariableCount];
                var ii = nextVar.originalXIndex;
                var panelSizeX = nextVar.x - variableView.x;
                if(setChanged || !previousAxisOrder[I] || previousAxisOrder[I][0] !== x || previousAxisOrder[I][1] !== panelSizeX) {
                    previousAxisOrder[I] = [x, panelSizeX];
                    items.push({
                        resolution: [width, height],
                        viewBoxPosition: [x, 0],
                        viewBoxSize: [panelSizeX, panelSizeY],
                        var1A: utils.range(16).map(function(d) {return d === i  ? 1 : 0}),
                        var2A: utils.range(16).map(function(d) {return d === ii ? 1 : 0}),
                        var1B: utils.range(16).map(function(d) {return d + 16 === i  ? 1 : 0}),
                        var2B: utils.range(16).map(function(d) {return d + 16 === ii ? 1 : 0}),
                        var1C: utils.range(16).map(function(d) {return d + 32 === i  ? 1 : 0}),
                        var2C: utils.range(16).map(function(d) {return d + 32 === ii ? 1 : 0}),
                        hiA: utils.range(16).map(function(i) {return valid(i, 0)  ? 1 - orig(i).filter[0] : 1}),
                        loA: utils.range(16).map(function(i) {return valid(i, 0)  ? 1 - orig(i).filter[1] : 0}),
                        hiB: utils.range(16).map(function(i) {return valid(i, 16) ? 1 - orig(i + 16).filter[0] : 1}),
                        loB: utils.range(16).map(function(i) {return valid(i, 16) ? 1 - orig(i + 16).filter[1] : 0}),
                        hiC: utils.range(16).map(function(i) {return valid(i, 32) ? 1 - orig(i + 32).filter[0] : 1}),
                        loC: utils.range(16).map(function(i) {return valid(i, 32) ? 1 - orig(i + 32).filter[1] : 0}),
                        scissorX: x,
                        scissorWidth: panelSizeX,
                        rightmost: I === rightmostIndex
                    });
                }
            }

            window.cancelAnimationFrame(currentRaf)
            renderBlock(glAes, items, 0, performance.now())
        }
    })()

    var currentRaf = null

    var pixel = new Uint8Array(4)
    function ensureDraw(regl) {
        regl.read({
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            data: pixel
        })
    }

    function renderBlock(glAes, items, blockNumber, t) {

        do {

            var offset = blockNumber * blockLineCount
            var count = Math.min(blockLineCount, sampleCount - blockNumber * blockLineCount)
            for (var i = 0; i < items.length; i++) {
                var item = items[i]
                item.offset = 2 * offset
                item.count = 2 * count
                if(blockNumber === 0) {
                    gl.enable(gl.SCISSOR_TEST);
                    gl.scissor(item.scissorX, 0, item.rightmost ? width : item.scissorWidth, panelSizeY);
                    regl.clear({ color: [1, 1, 1, 1], depth: 1 }); // clearing is done in scissored panel only
                    // todo figure out how to idiomatically use scissored clear with regl; doesn't appear to work
                }
            }
            glAes(items)
            blockNumber++
            ensureDraw(regl)
        } while(performance.now() - t < rafWorkTime && (blockNumber - 1) * blockLineCount + count < sampleCount)

        if(blockNumber * blockLineCount + count < sampleCount) {
            currentRaf = window.requestAnimationFrame(function(t) {
                renderBlock(glAes, items, blockNumber, t)
            })
        }
    }

    function destroy() {
        overlay.destroy()
        regl.destroy()
    }

    return {
        render: render,
        destroy: destroy
    }
}