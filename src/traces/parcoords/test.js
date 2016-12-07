// for WIP development stage only, use it by
// budo index.js --live -- -e test.js -o bundle.js

var parcoords = require('./parcoords');
var data = require('./dataAdapter');
var layout = require('./layout');

var div = document.createElement('div');
document.body.appendChild(div);

var tweakables = parcoords(div, data.filter(function(d) {return !d.integer}).slice(0, 6), layout);


if(0)
window.setTimeout(function() {
    parcoords(div, data.sort(function(a,b) {return a.variableName < b.variableName ? -1 : a.variableName > b.variableName ? 1 : 0}), layout);
}, 10000)

window.setTimeout(window.s =  function() {
    var steps = 10
    var i = 0
    window.requestAnimationFrame(function anim() {
        if(i <= steps) {
            tweakables.variables[1].scatter = Math.pow(i / steps, 1/2);
            tweakables.renderers[0]()
            tweakables.renderers[1]()
            i++;
            window.requestAnimationFrame(anim)
        }
    })
}, 2000)

window.d = function() {
    var steps = 10
    var i = steps
    window.requestAnimationFrame(function anim() {
        if(i >= 0) {
            tweakables.variables[1].scatter = Math.pow(i / steps, 1/2);
            tweakables.renderers[0]()
            tweakables.renderers[1]()
            i--;
            window.requestAnimationFrame(anim)
        }
    })
}
