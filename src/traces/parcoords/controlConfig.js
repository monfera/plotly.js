var debug = false

module.exports = {
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
}