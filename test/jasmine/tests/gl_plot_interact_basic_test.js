'use strict';

var Plotly = require('@lib/index');
var mouseEvent = require('../assets/mouse_event');

// Test utilities
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

// Expected shape of projection-related data
var cameraStructure = {
    up: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)},
    center: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)},
    eye: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)}
};

function makePlot(gd, mock) {
    return Plotly.plot(gd, mock.data, mock.layout);
}

function addEventCallback(graphDiv) {
    var relayoutCallback = jasmine.createSpy('relayoutCallback');
    graphDiv.on('plotly_relayout', relayoutCallback);
    return {graphDiv: graphDiv, relayoutCallback: relayoutCallback};
}

function verifyInteractionEffects(tuple) {

    // One 'drag': simulating fairly thoroughly as the mouseup event is also needed here
    mouseEvent('mousemove', 400, 200);
    mouseEvent('mousedown', 400, 200);
    mouseEvent('mousemove', 320, 320, {buttons: 1});
    mouseEvent('mouseup', 320, 320);

    // Check event emission count
    expect(tuple.relayoutCallback).toHaveBeenCalledTimes(1);

    // Check structure of event callback value contents
    expect(tuple.relayoutCallback).toHaveBeenCalledWith(jasmine.objectContaining({scene: cameraStructure}));

    // Check camera contents on the DIV layout
    var divCamera = tuple.graphDiv.layout.scene.camera;

    expect(divCamera).toEqual(cameraStructure);

    return tuple.graphDiv;
}

function testEvents(plot) {
    return plot
        .then(function(graphDiv) {
            var tuple = addEventCallback(graphDiv); // TODO disuse tuple with ES6
            verifyInteractionEffects(tuple);
        });
}

function colorface(F, ratio) {

    F.push([
        'rgb(',
        Math.round(ratio * 127 + 128),
        ',',
        Math.round(0),
        ',',
        Math.round(255 - ratio * 127),
        ')'].join(""));
}

describe('gl3d plots', function() {

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {return
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    fit('should respond to drag interactions with mock of partially set camera', function(done) {

        var mock = require('@mocks/gl3d_moonshot.json')

        var data = mock.data
        var s = data[0]

        var layout = mock.layout

        var X = []
        var Y = []
        var Z = []
        var I = []
        var J = []
        var K = []
        var F = []

        var circleRadius = 15;
        var trianglesPerCircle = 40
        var rowCount = 100;
        var heightIncrement = 4;

        var angle, x, y, z, h, c, mate1a, mate1b, mate2a, mate2b;

        var offset = false;
        var index = 0;

        function centerX(z) {
            return 40 * Math.cos(z/20);
        }

        function centerY(z) {
            return 20 * Math.sin(z/37);
        }

        function radius(z) {
            return circleRadius + circleRadius / 2 * Math.sin(33 + z / 27);
        }

        for(h = 0; h < rowCount; h++) {

            z = h * heightIncrement;

            for (c = 0; c < trianglesPerCircle; c++) {

                angle = (c + (offset ? 0.5 : 0)) * Math.PI * 2 / trianglesPerCircle;

                x = centerX(z) + Math.cos(angle) * radius(z); // could be cached
                y = centerY(z) + Math.sin(angle) * radius(z); // could be cached

                X.push(x);
                Y.push(y);
                Z.push(z);

                // winding order: clockwise
                mate1a = index - trianglesPerCircle + 1 - (c === trianglesPerCircle - 1  ? trianglesPerCircle : 0);
                mate1b = index - trianglesPerCircle;

                if(mate1a >= 0 && mate1b >= 0) {
                    I.push(index); J.push(mate1a); K.push(mate1b);
                    colorface(F, h / rowCount);
                }

                // winding order: clockwise
                mate2a = index - trianglesPerCircle;
                mate2b = index - 1 + (c === 0 ? trianglesPerCircle : 0);

                if(mate2a >= 0 && mate2b >= 0) {
                    I.push(index); J.push(mate2a); K.push(mate2b);
                    colorface(F, h / rowCount);
                }


                index++;
            }

            offset = !offset;
        }

        X.push(100)
        X.push(-100)
        Y.push(100)
        Y.push(-100)
        Z.push(100)
        Z.push(-100)

        if(1) {
            s.x = X;
            s.y = Y;
            s.z = Z;
            s.i = I;
            s.j = J;
            s.k = K;
            s.facecolor = F;
        }

        window.gd = gd
        window.data = data
        window.s = s
        window.Plotly = Plotly

        Plotly.plot(gd, data, layout)
            .then(done);
    });

});
