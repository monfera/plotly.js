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

function catmullRom(alpha, x, y, Tratio) {

    var t = [0];
    var d, c1, c2, i;
    for(i = 0; i < 3; i++) {
        t[i + 1] = Math.pow(Math.sqrt(Math.pow(x[i + 1] - x[i], 2) + Math.pow(y[i + 1] - y[i], 2)), alpha) + t[i];
    }

    var T = t[1] + Tratio * (t[2] - t[1]);

    d = t[1] - t[0];
    c1 = (t[1] - T) / d;
    c2 = (T - t[0]) / d;
    var A1x = c1*x[0] + c2*x[1];
    var A1y = c1*y[0] + c2*y[1];

    d = t[2] - t[1];
    c1 = (t[2] - T) / d;
    c2 = (T - t[1]) / d;
    var A2x = c1*x[1] + c2*x[2];
    var A2y = c1*y[1] + c2*y[2];

    d = t[3] - t[2];
    c1 = (t[3] - T) / d;
    c2 = (T - t[2]) / d;
    var A3x = c1*x[2] + c2*x[3];
    var A3y = c1*y[2] + c2*y[3];

    d = t[2] - t[0];
    c1 = (t[2] - T) / d;
    c2 = (T - t[0]) / d;
    var B1x = c1*A1x + c2*A2x;
    var B1y = c1*A1y + c2*A2y;

    d = t[3] - t[1];
    c1 = (t[3] - T) / d;
    c2 = (T - t[1]) / d;
    var B2x = c1*A2x + c2*A3x;
    var B2y = c1*A2y + c2*A3y;

    d = t[2] - t[1];
    c1 = (t[2] - T) / d;
    c2 = (T - t[1]) / d;
    var Cx = c1*B1x + c2*B2x;
    var Cy = c1*B1y + c2*B2y;

    return [Cx, Cy];
}

var quadCount = 36;

var sinVector = [];
var cosVector = [];
for(var q = 0; q < quadCount; q++) {
    var a = q * Math.PI * 2 / quadCount;
    sinVector.push(Math.sin(a));
    cosVector.push(Math.cos(a));
}

var lastGymbal = null;

function cylinderMaker(r1, r2, uu, vv, ww, f1, f2, continuable) {

    var X = [];
    var Y = [];
    var Z = [];

    var I = [];
    var J = [];
    var K = [];
    var F = [];

    var av = addVertex.bind(null, X, Y, Z);
    var af = addFace.bind(null, I, J, K, F);

    var q, vert, sa, ca;

    var x, y, z, xx, yy, zz;

    var length = Math.sqrt(uu * uu + vv * vv + ww * ww);

    var u = uu / length;
    var v = vv / length;
    var w = ww / length;

    // Gymbaling (fixme switch to quaternion based solution when time permits)
    var sameGymbal;
    var epsilon = 1e-9;
    if(w > epsilon) {
        x = -1; y = -1; z = (u + v) / w;
        sameGymbal = lastGymbal === 1;
        lastGymbal = 1;
    } else if(v > epsilon) {
        x = -1; y = (u + w) / v; z = -1;
        sameGymbal = lastGymbal === 2;
        lastGymbal = 2;
    } else if(u > epsilon) {
        x = (v + w) / u; y = -1; z = -1;
        sameGymbal = lastGymbal === 3;
        lastGymbal = 3;
    } else {
        x = 1; y = 0; z = 0;
        sameGymbal = lastGymbal === 3;
        lastGymbal = 3;
    }
    var cont = continuable && sameGymbal;

    var xxb, yyb, zzb, xxc, yyc, zzc, xxs, yys, zzs;

    length = Math.sqrt(x * x + y * y + z * z) / r1;
    x /= length;
    y /= length;
    z /= length;

    xxb = u*(u*x+v*y+w*z);
    yyb = v*(u*x+v*y+w*z);
    zzb = w*(u*x+v*y+w*z);

    xxc = x*(v*v+w*w)-u*(v*y+w*z);
    yyc = y*(u*u+w*w)-v*(u*x+w*z);
    zzc = z*(u*u+v*v)-w*(u*x+v*y);

    xxs = v*z-w*y;
    yys = w*x-u*z;
    zzs = u*y-v*x;

    var o = cont ? -quadCount : 0; // offset for possible welding (cont == true)

    if(!cont)
        for(q = 0; q < quadCount; q++) {

            sa = sinVector[q];
            ca = cosVector[q];

            xx = xxb+xxc*ca+xxs*sa;
            yy = yyb+yyc*ca+yys*sa;
            zz = zzb+zzc*ca+zzs*sa;

            av(xx, yy, zz);
        }

    length = Math.sqrt(x * x + y * y + z * z) / r2; // renormalize it for the other circle
    x /= length;
    y /= length;
    z /= length;

    xxb = u*(u*x+v*y+w*z);
    yyb = v*(u*x+v*y+w*z);
    zzb = w*(u*x+v*y+w*z);

    xxc = x*(v*v+w*w)-u*(v*y+w*z);
    yyc = y*(u*u+w*w)-v*(u*x+w*z);
    zzc = z*(u*u+v*v)-w*(u*x+v*y);

    xxs = v*z-w*y;
    yys = w*x-u*z;
    zzs = u*y-v*x;

    for(q = 0; q < quadCount; q++) {

        sa = sinVector[q];
        ca = cosVector[q];

        xx = xxb+xxc*ca+xxs*sa;
        yy = yyb+yyc*ca+yys*sa;
        zz = zzb+zzc*ca+zzs*sa;

        av(xx + uu, yy + vv, zz + ww);
    }

    for(q = 0; q < quadCount; q++) {

        vert = q;

        af(vert + o, vert + quadCount + o, (vert + 1) % quadCount + o, f1);
        af((vert + 1) % quadCount + o, vert + quadCount + o, (vert + 1) % quadCount + quadCount + o, f2);
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
//if(cont) debugger
    return model;
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
//       addLine(cylinderMaker(20, x2-x, y2-y, z2-z), x, y, z, randomColor(), index, X, Y, Z, I, J, K, F)
function addLine(geom, x1, y1, z1, vOffset, X, Y, Z, I, J, K, F) {

    var v, p;

    var mx = geom.x;
    var my = geom.y;
    var mz = geom.z;
    var mi = geom.i;
    var mj = geom.j;
    var mk = geom.k;
    var mf = geom.f;

    for(v = 0; v < mx.length; v++) {

        X.push(mx[v] + x1);
        Y.push(my[v] + y1);
        Z.push(mz[v] + z1);
    }

    for(p = 0; p < mi.length; p++) {
        I.push(vOffset + mi[p]);
        J.push(vOffset + mj[p]);
        K.push(vOffset + mk[p]);
        F.push(mf[p]);
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
        var heightIncrement = 1;

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

            z = t * heightIncrement - 100;

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

        var pointCount = 10;
        var lineCount = 100;
        var n, r, r2, c, c2;

        var p = {
            x: [],
            y: [],
            z: [],
            r: [],
            c: []
        }

        if(true) {

            for(n = 0; n < pointCount; n++) {

                x = 1000 * n / pointCount * 0.2 - 100;
                y = Math.cos(10 * n / pointCount) * 100;
                z = 0 * Math.sin(10 * n / pointCount) * 100;
                r = 10 + 5 * Math.sin(1000 * n / pointCount / 20);
                c = [Math.round(256 * n / (pointCount - 1)),0,Math.round(256 * (pointCount - 1 - n) / (pointCount - 1))];

                p.x.push(x);
                p.y.push(y);
                p.z.push(z);
                p.r.push(r);
                p.c.push(c);
            }

            for(n = 0; n < pointCount; n++) {
                // if(true || n === 0 || n === Math.round(pointCount / 2) || n === pointCount - 1)
                index = addPointMarker(unitSphere, p.x[n], p.y[n], p.z[n], 'rgb(64,64,255)', 1.5, index, X, Y, Z, I, J, K, F)
            }

            var rp = {
                x: [],
                y: [],
                z: [],
                r: [],
                c: []
            };

            var upsamplingFactor = 10; // convert every original point to as many upsampled points
            var upsampledPointCount = (pointCount - 3) * upsamplingFactor; // intervals with beginning / end original points can't be used
            for(n = 0; n < pointCount - 3; n++) {

                for(var m = 0; m < upsamplingFactor; m++) {

                    if('centripetal' == 'linear') {

                        // linear (well... adjust indices)

                        var c1 = m / upsamplingFactor;
                        var c2 = (upsamplingFactor - m) / upsamplingFactor;

                        rp.x.push(c2 * p.x[n] + c1 * p.x[n + 1]);
                        rp.y.push(c2 * p.y[n] + c1 * p.y[n + 1]);
                        rp.z.push(c2 * p.z[n] + c1 * p.z[n + 1]);
                        rp.r.push(c2 * p.r[n] + c1 * p.r[n + 1]);
                        rp.c.push([
                            c2 * p.c[n][0] + c1 * p.c[n + 1][0], // r
                            c2 * p.c[n][1] + c1 * p.c[n + 1][1], // g
                            c2 * p.c[n][2] + c1 * p.c[n + 1][2]  // b
                        ]);

                    } else {

                        // centripetal

                        var c1 = m / upsamplingFactor;
                        var c2 = (upsamplingFactor - m) / upsamplingFactor;

                        var xy = catmullRom(0.5, [p.x[n], p.x[n+1], p.x[n + 2], p.x[n + 3]], [p.y[n ], p.y[n+1], p.y[n + 2], p.y[n + 3]], c1);

                        rp.x.push(xy[0] /*c2 * p.x[n] + c1 * p.x[n + 1]*/);
                        rp.y.push(xy[1] /*c2 * p.y[n] + c1 * p.y[n + 1]*/);
                        rp.z.push(c2 * p.z[n] + c1 * p.z[n + 1]);
                        rp.r.push(1 || catmullRom(0, [0, 1, 2, 3], [p.r[n - 1], p.r[n], p.r[n + 1], p.r[n + 2]], c1 + 1 )[1]);
                        rp.c.push([
                            c2 * p.c[n][0] + c1 * p.c[n + 1][0], // r
                            c2 * p.c[n][1] + c1 * p.c[n + 1][1], // g
                            c2 * p.c[n][2] + c1 * p.c[n + 1][2]  // b
                        ]);



                    }
                }

            }
            // last segment

            rp.x.push(p.x[pointCount - 2]);
            rp.y.push(p.y[pointCount - 2]);
            rp.z.push(p.z[pointCount - 2]);
            rp.r.push(1);
            rp.c.push(p.c[pointCount - 2]);



            for(n = 0; n < rp.x.length-1; n++) {

                point1 = n;
                point2 = n + 1;

                x = rp.x[point1];
                y = rp.y[point1];
                z = rp.z[point1];
                r = rp.r[point1];
                c = 'rgb(' + rp.c[point1].join() + ')';

                x2 = rp.x[point2];
                y2 = rp.y[point2];
                z2 = rp.z[point2];
                r2 = rp.r[point2];
                c2 = 'rgb(' + rp.c[point2].join() + ')';

                index = addPointMarker(unitSphere, x, y, z, 'rgb(64,64,255)', 1.1, index, X, Y, Z, I, J, K, F)
                index = addLine(cylinderMaker(r, r2, x2 - x, y2 - y, z2 - z, c, c2, false), x, y, z, index, X, Y, Z, I, J, K, F)
            }

        } else {

            var pointCache = {}, pointx, pointy, pointz;

            n = pointCount;
            while (n > 0) {

                pointx = Math.round((200 * Math.random() - 100) / 20) * 20;
                pointy = Math.round((200 * Math.random() - 100) / 20) * 20;
                pointz = Math.round((200 * Math.random() - 100) / 20) * 20;

                if (!pointCache[[pointx, pointy, pointz].join()]) {

                    pointCache[[pointx, pointy, pointz].join()] = true;

                    p.x.push(pointx);
                    p.y.push(pointy);
                    p.z.push(pointz);
                    n--;
                }
            }


            /*
             points.x.push(1);
             points.y.push(2);
             points.z.push(3);

             points.x.push(4);
             points.y.push(4);
             points.z.push(4);
             */

            var lineCache = {}, point1, point2, x2, y2, z2, distance;

            n = lineCount;
            while (n > 0) {

                point1 = Math.floor(pointCount * Math.random());
                point2 = Math.floor(pointCount * Math.random());

                if (
                    !(point1 === point2) && !lineCache[[point1, point2].join()] && !lineCache[[point2, point1].join()]
                    && [
                        p.x[point1] === p.x[point2],
                        p.y[point1] === p.y[point2],
                        p.z[point1] === p.z[point2]
                    ].reduce(function (a, b) {
                        return a + b
                    }, 0) === 2
                ) {

                    lineCache[[point1, point2].join()] = true;
                    n--;

                    x = p.x[point1];
                    y = p.y[point1];
                    z = p.z[point1];

                    x2 = p.x[point2];
                    y2 = p.y[point2];
                    z2 = p.z[point2];

                    index = addLine(cylinderMaker(1 + 3 * Math.random(), x2 - x, y2 - y, z2 - z, randomColor(), randomColor()), x, y, z, index, X, Y, Z, I, J, K, F)
                }
            }

            var members = Object.keys(lineCache).join().split(",").map(parseFloat);

            for (n = 0; n < pointCount; n++) {

                if (members.indexOf(n) !== -1) {

                    x = p.x[n];
                    y = p.y[n];
                    z = p.z[n];

                    index = addPointMarker(unitSphere, x, y, z, randomColor(), 4, index, X, Y, Z, I, J, K, F)
                }
            }

        }

        // Extend the place to ensure correct aspect ratio
        X.push(-100)
        X.push(100)
        Y.push(-100)
        Y.push(100)
        Z.push(-100)
        Z.push(100)

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
