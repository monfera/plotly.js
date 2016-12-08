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
        coloringvariable: 0,
        depthVariable: 0,
        contextcolor: [0,0,0], // [192,192,192], // rgb array, 0..255
        contextopacity: 16, // 255, // 0..255

        // technical config
        pixelratio: 1, //window.devicePixelRatio, // using 2 or devicePixelRatio sharpens lines, slower
        blocklinecount: 5000, // number of lines drawn in one increment



        visiblewidth: 4,
        capturewidth: 48,
        mousethrottle: 1000 / 30,

        handleheight: 16,
        handleopacity: 0,
        handleoverlap: 0, // effect can be seen with debug = true
        fillcolor: 'magenta',
        fillopacity: 1,
        strokecolor: 'white',
        strokeopacity: 1,
        strokewidth: 1,
        integerpadding: 0, // use 1 to offset integer extreme values by half pitch
        averageTickDistance: 50, // in pixels,
        verticalpadding: 2,

        focusalphablending: false,

        // for debugging:
        captureZoneBorderColor: debug ? 'red' : "",
        captureZoneFillColor: debug ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0)'

    };
});