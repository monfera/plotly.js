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
        Math.round(32),
        ',',
        Math.round(255 - ratio * 127),
        ')'].join(""));
}

function addVertex(X, Y, Z, x, y, z) {
    X.push(x);
    Y.push(y);
    Z.push(z);
}

function randomColor() {
    return 'rgb('
        + Math.floor(256 * Math.random()) + ','
        + Math.floor(256 * Math.random()) + ','
        + Math.floor(256 * Math.random()) + ')';
}

function addFace(I, J, K, F, i, j, k, f) {
    I.push(i);
    J.push(j);
    K.push(k);
    F.push(f);
}

function unitCylinderMaker() {

    var X = [];
    var Y = [];
    var Z = [];

    var I = [];
    var J = [];
    var K = [];
    var F = [];

    var av = addVertex.bind(null, X, Y, Z);
    var af = addFace.bind(null, I, J, K, F);

    var quadCount = 36;
    var triangleCount = 2 * quadCount;
    var q, angle, v;

    for(q = 0; q < quadCount; q++) {

        angle = q * Math.PI * 2 / quadCount;

        av(Math.cos(angle), Math.sin(angle), 0);
        av(Math.cos(angle), Math.sin(angle), 1);
    }

    for(q = 0; q < quadCount; q++) {

        v = 2 * q;

        af(                      v, (v + 1), (v + 2) % triangleCount);
        af((v + 2) % triangleCount, (v + 1), (v + 3) % triangleCount);
    }

    var model = {
        x: X,
        y: Y,
        z: Z,
        i: I,
        j: J,
        k: K,
        f: F
    };

    return model;
}

var unitCylinder = unitCylinderMaker();

function unitIcosahedron() {

    var X = [];
    var Y = [];
    var Z = [];

    var I = [];
    var J = [];
    var K = [];
    var F = [];

    var s = Math.sqrt((5 - Math.sqrt(5)) / 10);
    var t = Math.sqrt((5 + Math.sqrt(5)) / 10);

    var av = addVertex.bind(null, X, Y, Z);
    var af = addFace.bind(null, I, J, K, F);

    av(-s,  t,  0);
    av( s,  t,  0);
    av(-s, -t,  0);
    av( s, -t,  0);

    av( 0, -s,  t);
    av( 0,  s,  t);
    av( 0, -s, -t);
    av( 0,  s, -t);

    av( t,  0, -s);
    av( t,  0,  s);
    av(-t,  0, -s);
    av(-t,  0,  s);

    af(0, 5, 11);
    af(0, 1, 5);
    af(0, 7, 1);
    af(0, 10, 7);
    af(0, 11, 10);

    af(1, 9, 5);
    af(5, 4, 11);
    af(11, 2, 10);
    af(10, 6, 7);
    af(7, 8, 1);

    af(3, 4, 9);
    af(3, 2, 4);
    af(3, 6, 2);
    af(3, 8, 6);
    af(3, 9, 8);

    af(4, 5, 9);
    af(2, 11, 4);
    af(6, 10, 2);
    af(8, 7, 6);
    af(9, 1, 8);

    var model = {
        x: X,
        y: Y,
        z: Z,
        i: I,
        j: J,
        k: K,
        f: F
    };

    return model;
}

function increaseLoD(m) {

    var I = [];
    var J = [];
    var K = [];
    var F = [];

    var p;

    var mx = m.x.slice();
    var my = m.y.slice();
    var mz = m.z.slice();
    var mi = m.i;
    var mj = m.j;
    var mk = m.k;
    var mf = m.f;

    var midx1, midy1, midz1, midx2, midy2, midz2, midx3, midy3, midz3, v1, v2, v3, midi1, midi2, midi3, k, length;

    var vCache = {};

    for(p = 0; p < mi.length; p++) {

        v1 = mi[p];
        v2 = mj[p];
        v3 = mk[p];

        k = [v1, v2];
        if(vCache[k.join()]) {
            midi1 = vCache[k.join()];
        } else {
            midx1 = (mx[v1] + mx[v2]) / 2;
            midy1 = (my[v1] + my[v2]) / 2;
            midz1 = (mz[v1] + mz[v2]) / 2;
            length = Math.sqrt(midx1 * midx1 + midy1 * midy1 + midz1 * midz1);
            mx.push(midx1 / length);
            my.push(midy1 / length);
            mz.push(midz1 / length);
            midi1 = mx.length - 1; // vertex index to the newly created midpoint
            vCache[k.join()] = midi1;
        }

        k = [v2, v3];
        if(vCache[k.join()]) {
            midi2 = vCache[k.join()];
        } else {
            midx2 = (mx[v2] + mx[v3]) / 2;
            midy2 = (my[v2] + my[v3]) / 2;
            midz2 = (mz[v2] + mz[v3]) / 2;
            length = Math.sqrt(midx2 * midx2 + midy2 * midy2 + midz2 * midz2);
            mx.push(midx2 / length);
            my.push(midy2 / length);
            mz.push(midz2 / length);
            midi2 = mx.length - 1; // vertex index to the newly created midpoint
            vCache[k.join()] = midi2;
        }

        k = [v3, v1];
        if(vCache[k.join()]) {
            midi2 = vCache[k.join()];
        } else {
            midx3 = (mx[v3] + mx[v1]) / 2;
            midy3 = (my[v3] + my[v1]) / 2;
            midz3 = (mz[v3] + mz[v1]) / 2;
            length = Math.sqrt(midx3 * midx3 + midy3 * midy3 + midz3 * midz3);
            mx.push(midx3 / length);
            my.push(midy3 / length);
            mz.push(midz3 / length);
            midi3 = mx.length - 1; // vertex index to the newly created midpoint
            vCache[k.join()] = midi3;
        }

        I.push(mi[p]);
        J.push(midi1);
        K.push(midi3);
        F.push(mf[p]);

        I.push(mj[p]);
        J.push(midi2);
        K.push(midi1);
        F.push(mf[p]);

        I.push(mk[p]);
        J.push(midi3);
        K.push(midi2);
        F.push(mf[p]);

        I.push(midi1);
        J.push(midi2);
        K.push(midi3);
        F.push(mf[p]);
    }

    var model = {
        x: mx,
        y: my,
        z: mz,
        i: I,
        j: J,
        k: K,
        f: F
    };

    return model;
}

var unitSphere = ((increaseLoD(increaseLoD(increaseLoD(increaseLoD(unitIcosahedron()))))));

function addPointMarker(geom, x, y, z, f, r, vOffset, X, Y, Z, I, J, K, F) {

    var v, p;

    var mx = geom.x;
    var my = geom.y;
    var mz = geom.z;
    var mi = geom.i;
    var mj = geom.j;
    var mk = geom.k;
    var mf = geom.f;

    for(v = 0; v < mx.length; v++) {
        X.push(x + mx[v] * r);
        Y.push(y + my[v] * r);
        Z.push(z + mz[v] * r);
    }

    for(p = 0; p < mi.length; p++) {
        I.push(vOffset + mi[p]);
        J.push(vOffset + mj[p]);
        K.push(vOffset + mk[p]);
        F.push(f);
    }

    return vOffset + mx.length;
}

function addLine(geom, x1, y1, z1, x2, y2, z2, f, r, l, vOffset, X, Y, Z, I, J, K, F) {

    var v, p;

    var mx = geom.x;
    var my = geom.y;
    var mz = geom.z;
    var mi = geom.i;
    var mj = geom.j;
    var mk = geom.k;
    var mf = geom.f;

    var xd = x2 - x1;
    var yd = y2 - y1;
    var zd = z2 - z1;

    for(v = 0; v < mx.length; v++) {
        X.push((1 - mz[v]) * x1 + mx[v] * r + mz[v] * x2);
        Y.push((1 - mz[v]) * y1 + my[v] * r + mz[v] * y2);
        Z.push((1 - mz[v]) * z1 + mz[v] * z2);
    }

    for(p = 0; p < mi.length; p++) {
        I.push(vOffset + mi[p]);
        J.push(vOffset + mj[p]);
        K.push(vOffset + mk[p]);
        F.push(f);
    }

    return vOffset + mx.length;
}

fdescribe('gl3d plots', function() {

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
        var tCount = 100;
        var rowCount = 100;
        var heightIncrement = 4;

        var angle, t, x, y, z, c, mate1a, mate1b, mate2a, mate2b;

        var offset = false;
        var index = 0;

        function centerX(z) {
            return 40 * Math.cos(z/20);
        }

        function centerY(z) {
            return 40 * Math.sin(z/37);
        }

        function radius(z) {
            return circleRadius + circleRadius / 2 * Math.sin(33 + z / 27);
        }

        if(0)
        for(t = 0; t < tCount; t++) {

            z = t * heightIncrement;

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
                    colorface(F, t / rowCount);
                }

                // winding order: clockwise
                mate2a = index - trianglesPerCircle;
                mate2b = index - 1 + (c === 0 ? trianglesPerCircle : 0);

                if(mate2a >= 0 && mate2b >= 0) {
                    I.push(index); J.push(mate2a); K.push(mate2b);
                    colorface(F, t / rowCount);
                }


                index++;
            }

            offset = !offset;
        }

        var pointCount = 2;
        var lineCount = 1;
        var n;

        var points = {
            x: [],
            y: [],
            z: []
        }

        for(n = 0; n < pointCount; n++) {
            points.x.push(200 * Math.random() - 100);
            points.y.push(200 * Math.random() - 100);
            points.z.push(200 * Math.random() - 100);
        }

        for(n = 0; n < pointCount; n++) {

            x  = points.x[n];
            y  = points.y[n];
            z  = points.z[n];

            index = addPointMarker(unitSphere, x, y, z, randomColor(), 20, index, X, Y, Z, I, J, K, F)
        }

        var pointCache = {}, point1, point2, x2, y2, z2, distance;

        n = lineCount;
        while(n > 0) {

            point1 = Math.floor(pointCount * Math.random());
            point2 = Math.floor(pointCount * Math.random());

            if(!(point1 === point2) && !pointCache[[point1,point2].join()] && !pointCache[[point2,point1].join()]) {

                pointCache[[point1,point2].join()] = true;
                n--;

                x = points.x[point1];
                y = points.y[point1];
                z = points.z[point1];

                x2 = points.x[point2];
                y2 = points.y[point2];
                z2 = points.z[point2];

                distance = Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2) + Math.pow(z2 - z, 2));

                index = addLine(unitCylinder, x, y, z, x2, y2, z2, randomColor(), 20, distance, index, X, Y, Z, I, J, K, F)
            }
        }


        // Extend the place to ensure correct aspect ratio
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
