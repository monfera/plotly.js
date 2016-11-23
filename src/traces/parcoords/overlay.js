var controlConfig = require('./overlayConfig');
var utils = require('./utils');

module.exports = function (svgRoot, config) {

    var width = config.width
    var height = config.height
    var panelSizeX = config.panelSizeX
    var panelSizeY = config.panelSizeY

    var filterSize = controlConfig.filterSize

    var capturePaddingX = Math.max(panelSizeX / 2 - filterSize, 0)
    var svg = svgRoot.namespaceURI

    svgRoot.setAttribute('width', width)
    svgRoot.setAttribute('height', height)

    function attachEventHandler(root, redraw, padding, move, release) {

        var captureZonePerimeterX = width
        var captureZonePerimeterY = height
        var mouseDowned = false
        var mouseDownX = NaN
        var mouseDownY = NaN

        function mouseDown(e) {
            e.preventDefault() // prevents the Firefox 'drag&drop' reflex on 2nd use
            svgRoot.style['pointer-events'] = 'none'
            root.style['pointer-events'] = 'all'
            mouseDownX = e.pageX
            mouseDownY = e.pageY
            padding[0] = captureZonePerimeterX
            padding[1] = captureZonePerimeterY
            mouseDowned = true
        }

        function mouseUp() {
            padding[0] = capturePaddingX
            padding[1] = 0
            mouseDowned = false
            release()
            redraw()
            svgRoot.style['pointer-events'] = ''
            root.style['pointer-events'] = ''
        }

        function mousemove(e) {
            if(e.buttons === 0 && mouseDowned)
                mouseUp()
            if(mouseDowned)
                move(e.pageY - mouseDownY)
        }

        root.addEventListener('mousedown', mouseDown)
        root.addEventListener('mouseup', mouseUp)
        root.addEventListener('mousemove', utils.throttle(mousemove,
            controlConfig.mousemoveThrottle), { passive: true })
    }

    function barBoxToDomain(rect, padding, loHi) {
        var lo = loHi[0]
        var hi = loHi[1]
        rect.setAttribute('y', panelSizeY * (1 - hi) - padding[1])
        rect.setAttribute('height', panelSizeY * (hi - lo) + 2 * padding[1])
        rect.setAttribute('x', - padding[0])
        rect.setAttribute('width', filterSize + 2 * padding[0])
    }

    function handleToDomain(handle, position) {
        var y = (1 - position) * panelSizeY
        handle.setAttribute('transform', 'translate(0,' + y + ')')
    }

    function handleBoxToDomain(bottom) {
        return function(rect, padding) {
            rect.setAttribute('y', (bottom ? 0 : -filterSize) - padding[1])
            rect.setAttribute('height', filterSize + 2 * padding[1])
            rect.setAttribute('x', - padding[0])
            rect.setAttribute('width', filterSize + 2 * padding[0])
        }
    }

    function setHandleExtent(index, handle, zone, domain, zonePadding,
                             handleToDomain, handleBoxToDomain) {
        return function(lo, hi) {
            var value = index ? hi : lo
            domain[index] = value
            handleToDomain(handle, value)
            handleBoxToDomain(zone, zonePadding, !!index)
        }
    }

    function enterFilterBarRect(root, domain) {

        var rect = document.createElementNS(svg, 'rect')
        rect.style['stroke-width'] = 0.0
        rect.style.fill = controlConfig.filterColor
        rect.style['fill-opacity'] = controlConfig.filterBarOpacity
        rect.style.stroke = controlConfig.filterColor
        rect.setAttribute('class', 'filterBarRect')
        rect.setAttribute('width', filterSize)
        barBoxToDomain(rect, [0, 0], domain)
        root.appendChild(rect)

        return function() {barBoxToDomain(rect, [0, 0], domain)}
    }

    function enterCaptureZone(padding, boxToDomain, move, release, domain) {
        var zone = document.createElementNS(svg, 'rect')
        attachEventHandler(
            zone,
            function() {return boxToDomain(zone, padding, domain)},
            padding,
            move,
            release
        )
        zone.style.fill = controlConfig.captureZoneFillColor
        zone.style.stroke = controlConfig.captureZoneBorderColor
        zone.setAttribute('class', 'captureZone')
        zone.setAttribute('width', filterSize)
        return zone
    }

    function enterBarCaptureZone(root, boxToDomain, move, release, domain) {
        var activeCaptureZonePadding = [capturePaddingX, 0]
        var filterBarCaptureZone = enterCaptureZone(
            activeCaptureZonePadding, boxToDomain, move, release, domain)
        boxToDomain(filterBarCaptureZone, activeCaptureZonePadding, domain)
        filterBarCaptureZone.style.cursor = 'pointer'
        root.appendChild(filterBarCaptureZone)
        return function() {
            boxToDomain(filterBarCaptureZone, activeCaptureZonePadding, domain)
        }
    }

    function enterGlyphMaker(root, bottom, move, release, domain) {

        var position = domain[bottom ? 0 : 1]
        var s = filterSize
        var dir = bottom ? 1 : -1

        var handle = document.createElementNS(svg, 'g')
        handle.setAttribute('class', 'handle')
        handleToDomain(handle, position)
        root.appendChild(handle)

        var handleGlyph = document.createElementNS(svg, 'path')
        handleGlyph.style.fill = controlConfig.filterColor
        handleGlyph.style['fill-opacity'] = controlConfig.handleGlyphOpacity
        handleGlyph.style['stroke-width'] = 0
        handleGlyph.style.stroke = controlConfig.filterColor
        handleGlyph.setAttribute('stroke-width', 1)
        handleGlyph.setAttribute('d', 'M0,' + dir * s + ' l' + s / 2 +','
            + dir * -s + ' l' + s/2 + ',' + dir * s + 'Z')
        handle.appendChild(handleGlyph)

        var zonePadding = [capturePaddingX, 0]
        var handleBox = handleBoxToDomain(bottom)
        var zone = enterCaptureZone(zonePadding, handleBox, move, release, domain)
        handleBoxToDomain(bottom)(zone, zonePadding)
        zone.style.cursor = 'row-resize'
        handle.appendChild(zone)

        return setHandleExtent(bottom ? 0 : 1, handle, zone, domain, zonePadding,
            handleToDomain, handleBox)
    }

    function makeOverlayPanel(translateX, loHi, callbacks) {

        var lo = loHi[0]
        var hi = loHi[1]

        var barMove = callbacks.barMove || function() {}
        var barRelease = callbacks.barRelease || function() {}
        var loMove = callbacks.loMove || function() {}
        var loRelease = callbacks.loRelease || function() {}
        var hiMove = callbacks.hiMove || function() {}
        var hiRelease = callbacks.hiRelease || function() {}

        var domain = [lo, hi]
        var setExtents = []

        setExtents.push(function(lo, hi) {
            domain[0] = lo
            domain[1] = hi
        })

        // panel
        var panel = document.createElementNS(svg, 'g')
        panel.setAttribute('class', 'panel')
        panel.setAttribute('transform', 'translate(' + translateX + ', 0)')
        svgRoot.appendChild(panel)

        // border
        var border = document.createElementNS(svg, 'rect')
        border.setAttribute('class', 'border')
        border.setAttribute('width', panelSizeX)
        border.setAttribute('height', panelSizeY)
        border.setAttribute('stroke-width', '1px')
        border.style.fill = 'none'
        border.style.stroke = controlConfig.panelBorderColor
        border.style['stroke-opacity'] = controlConfig.panelBorderOpacity
        panel.appendChild(border)

        // vertical filter
        var filter = document.createElementNS(svg, 'g')
        var x = 0.5 - filterSize / 2
        filter.setAttribute('class', 'filter')
        filter.setAttribute('transform', 'translate(' + x + ', 0)')
        panel.appendChild(filter)

        // vertical filter rectangle
        setExtents.push(enterFilterBarRect(filter, domain))

        // vertical filter rectangle - capture zone
        setExtents.push(enterBarCaptureZone(filter, barBoxToDomain,
            barMove, barRelease, domain))

        // bottom handle (with capture zone)
        setExtents.push(enterGlyphMaker(filter, true, loMove, loRelease, domain))

        // top handle (with capture zone)
        setExtents.push(enterGlyphMaker(filter, false, hiMove, hiRelease, domain))

        return function(lo, hi) {
            setExtents.forEach(function(set) {set(lo, hi)})
        }
    }

    function enterOverlayPanel(translateX, filter, render) {

        var originalFilter = filter.slice()

        function barMove(y) {
            var f0 = originalFilter[0] - y / panelSizeY
            var f1 = originalFilter[1] - y / panelSizeY
            if(f0 < 0) {
                f1 += 0 - f0
                f0 = 0
            }
            if(f1 > 1) {
                f0 -= f1 - 1
                f1 = 1
            }
            if(Math.abs(filter[0] - f0) >= 1 / panelSizeY) {
                filter[0] = f0
                filter[1] = f1
                changedDataDomain(filter)
            }
        }

        function barRelease() {
            originalFilter[0] = filter[0]
            originalFilter[1] = filter[1]
        }

        function loMove(y) {
            var f1 = originalFilter[1]
            var f0 = Math.max(0, Math.min(f1, originalFilter[0] - y / panelSizeY))
            if(Math.abs(filter[0] - f0) >= 1 / panelSizeY) {
                filter[0] = f0
                changedDataDomain(filter)
            }
        }

        function loRelease() {
            originalFilter[0] = filter[0]
        }

        function hiMove(y) {
            var f0 = originalFilter[0]
            var f1 = Math.min(1, Math.max(f0, originalFilter[1] - y / panelSizeY))
            if(Math.abs(filter[1] - f1) >= 1 / panelSizeY) {
                filter[1] = f1
                changedDataDomain(filter)
            }
        }

        function hiRelease() {
            originalFilter[1] = filter[1]
        }

        function changedDataDomain(filter) {
            filterControls(filter[0], filter[1])
            render(true)
        }

        var filterControls = makeOverlayPanel(translateX, filter, {
            barMove: barMove,
            barRelease: barRelease,
            loMove: loMove,
            loRelease: loRelease,
            hiMove: hiMove,
            hiRelease: hiRelease
        })
    }

    function destroy() {
        var range = document.createRange()
        range.selectNodeContents(svgRoot)
        range.deleteContents()
    }

    return {
        enterOverlayPanel: enterOverlayPanel,
        destroy: destroy
    }

}