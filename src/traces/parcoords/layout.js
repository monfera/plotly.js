module.exports = (function() {

    var debug = false

    var width = 1480
    var height = 275

    return {
        width: 1480,
        height: 275,
        panelSizeY: 275,
        padding: 64, // useful to make room for brush capture zones when resize handle is on top or bottom

        // coloring and depth variable should be the same unless for development testing
        coloringVariable: 0,
        depthVariable: 0,
        contextColor: [0,0,0], // [192,192,192], // rgb array, 0..255
        contextOpacity: 16, // 255, // 0..255

        // technical config
        canvasPixelRatio: 1, //window.devicePixelRatio, // using 2 or devicePixelRatio sharpens lines, slower
        blockLineCount: 5000, // number of lines drawn in one increment



        filterVisibleWidth: 4,
        filterCaptureWidth: 48,
        mousemoveThrottle: 1000 / 30,

        handleGlyphHeight: 16,
        handleGlyphOpacity: 0,
        handleGlyphOverlap: 0, // effect can be seen with debug = true
        filterBarFill: 'magenta',
        filterBarFillOpacity: 1,
        filterBarStroke: 'white',
        filterBarStrokeOpacity: 1,
        filterBarStrokeWidth: 1,
        integerPadding: 0, // use 1 to offset integer extreme values by half pitch
        averageTickDistance: 50, // in pixels,
        verticalPadding: 2,

        alphaBlending: false,

        // for debugging:
        captureZoneBorderColor: debug ? 'red' : "",
        captureZoneFillColor: debug ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0)'

    };
});