// for WIP development stage only, use it by
// budo index.js --live -- -e budo.js -o bundle.js

var parcoords = require('./parcoords');
var data = require('./dataAdapter');

var div = document.createElement('div');
document.body.appendChild(div);

parcoords(div,  data);
