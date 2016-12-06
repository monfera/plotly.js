// for WIP development stage only, use it by
// budo index.js --live -- -e test.js -o bundle.js

var parcoords = require('./parcoords');
var data = require('./dataAdapter');
var layout = require('./layout');

var div = document.createElement('div');
document.body.appendChild(div);

parcoords(div, data, layout);
parcoords(div, data, layout);
