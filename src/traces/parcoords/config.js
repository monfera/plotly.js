module.exports = function(model) {

    var width = 1480
    var height = 275

    var colorScale = function(d) {
        return Math.pow(Math.max(0, d), 1/2)
    }

    return {
        width: width,
        height: height,
        panelSizeX: width / model.variableCount,
        panelSizeY: height,
        padding: 64, // useful to make room for brush capture zones when resize handle is on top or bottom

        colorScale: colorScale,

        // coloring and depth variable should be the same unless for development testing
        coloringVariable: 0,
        depthVariable: 0,

        // technical config
        canvasPixelRatio: window.devicePixelRatio, // using 2 or devicePixelRatio sharpens lines, slower
        rafTimeRatio: 2, // a multiple of the 16.6ms rAF budget, use 0.5..5
        blockLineCount: 2000 // number of lines drawn in one increment
    }
};