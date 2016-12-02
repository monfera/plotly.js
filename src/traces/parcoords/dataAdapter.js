var utils = require('./utils');
var d3 = require('d3');

module.exports = (function() {

    //var data = require('./mocks/raw/DVN');
    //var data = require('./mocks/raw/LDG');
    //var data = require('./mocks/raw/MCT');
    //var data = require('./mocks/raw/PDS');
    //var data = require('./mocks/out5d');
    var data = require('./mocks/k26');
    //var data = require('./mocks/column/LDG');

    var expandTo = data.variableNames.length
    data.raw = utils.widen(data.raw, expandTo);
    data.variableNames = d3.range(expandTo).map(function(d) {return data.variableNames[d % data.variableNames.length] + '_' + Math.floor(Math.random() * 100)});
    data.integer = d3.range(expandTo).map(function(d) {return data.integer[d % data.integer.length]});

    return {raw: utils.ndarrayOrder(data.raw, 0), variableNames: data.variableNames, integer: data.integer}
})()