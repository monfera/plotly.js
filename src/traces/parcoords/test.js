// for WIP development stage only, use it by
// budo index.js --live -- -e test.js -o bundle.js

var parcoords = require('./parcoords');
var data = require('./dataAdapter');
var layout = require('./layout');

var div = document.createElement('div');
document.body.appendChild(div);

parcoords(div, data.filter(function(d) {return !d.integer}).slice(0, 6), layout);

if(0)
window.setTimeout(function() {
    parcoords(div, data.sort(function(a,b) {return a.variableName < b.variableName ? -1 : a.variableName > b.variableName ? 1 : 0}), layout);
}, 10000)
