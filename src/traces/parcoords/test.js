// for WIP development stage only, use it by
// budo index.js --live -- -e test.js -o bundle.js

var parcoords = require('./parcoords');
var mock = require('./dataAdapter');
var layout = mock.layout;
var data = mock.data[0].values;

var div = document.createElement('div');
document.body.appendChild(div);

var tweakables = parcoords(div, {
    data: data.filter(function(d) {return true || !d.integer}).slice(0, Infinity),
    layout: Object.assign(layout, mock.data[0].settings)
});

function smoothstep(x) {
    return x * x * (3 - 2 * x);
}

var steps = 8

window.s = function() {
    var i = 0
    window.requestAnimationFrame(function anim() {
        if(i <= steps) {
            tweakables.variables[0].scatter = smoothstep(i / steps);
            tweakables.renderers[0]()
            tweakables.renderers[1]()
            i++;
            window.requestAnimationFrame(anim)
        }
    })
}
window.d = function() {
    var i = steps
    window.requestAnimationFrame(function anim() {
        if(i >= 0) {
            tweakables.variables[0].scatter = smoothstep(i / steps);
            tweakables.renderers[0]()
            tweakables.renderers[1]()
            i--;
            window.requestAnimationFrame(anim)
        }
    })
}

if(0) {
    var i = 0;
    window.setInterval(function () {
        if ((++i) % 2) s(); else d()
    }, 2000)
}