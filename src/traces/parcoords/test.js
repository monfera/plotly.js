// for WIP development stage only, use it by
// budo index.js --live -- -e test.js -o bundle.js

var parcoords = require('./parcoords');
var data = require('./dataAdapter');
var layout = require('./layout');

var div = document.createElement('div');
document.body.appendChild(div);

var tweakables = parcoords(div, data.filter(function(d) {return !d.integer}), layout);

function smoothstep(x) {
    return x * x * (3 - 2 * x);
}

window.s = function() {
    var steps = 10
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
    var steps = 10
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
