var debug = false

module.exports = {
    filterSize: 16,
    mousemoveThrottle: 1000 / 30,

    panelBorderColor: 'black',
    panelBorderOpacity: 0.05,

    filterColor: 'black',
    handleGlyphOpacity: 0.1,
    filterBarOpacity: 0.05,

    // for debugging:
    captureZoneBorderColor: debug ? 'red' : "",
    captureZoneFillColor: debug ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0)'
}