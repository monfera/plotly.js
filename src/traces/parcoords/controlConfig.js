var debug = false

module.exports = {
    filterSize: 16,
    mousemoveThrottle: 1000 / 30,

    filterColor: 'black',
    handleGlyphHeight: 16,
    handleGlyphOpacity: 0,
    handleGlyphOverlap: 0, // effect can be seen with debug = true
    filterBarOpacity: 0.075,
    filterBarStroke: 'white',
    filterBarStrokeWidth: 0.3,
    integerPadding: 0, // use 1 to offset integer extreme values by half pitch
    averageTickDistance: 50, // in pixels,
    verticalPadding: 2,

    alphaBlending: false,

    // for debugging:
    captureZoneBorderColor: debug ? 'red' : "",
    captureZoneFillColor: debug ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0)'
}