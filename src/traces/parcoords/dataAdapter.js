var utils = require('./utils');
var d3 = require('d3');
var ndarray = require('ndarray');

module.exports = (function() {

    //var data = require('./mocks/raw/DVN');
    //var data = require('./mocks/raw/LDG');
    //var data = require('./mocks/raw/MCT');
    //var data = require('./mocks/raw/PDS');
    //var data = require('./mocks/out5d');
    var newFormat = require('./mocks/k26');
    //var data = require('./mocks/column/LDG');

    var data = {
        variableNames: newFormat.map(function(v) {return v.variableName;}),
        integer: newFormat.map(function(v) {return v.integer;}),
        raw: (function(untypedColumns){
            var nd = ndarray(new Float64Array(untypedColumns.length * untypedColumns[0].length), [untypedColumns.length, untypedColumns[0].length], [1, untypedColumns.length]);
            for(var i = 0; i < untypedColumns.length; i++)
                for(var j = 0; j < untypedColumns[0].length; j++)
                    nd.set(i, j, untypedColumns[i][j]);
            return nd
        })(newFormat.map(function(v) {return v.values;}))
    }

    var expandTo = data.variableNames.length // 64
    data.raw = utils.widen(data.raw, expandTo);
    data.variableNames = d3.range(expandTo).map(function(d) {return data.variableNames[d % data.variableNames.length] + '_' + Math.floor(Math.random() * 10000)});
    data.integer = d3.range(expandTo).map(function(d) {return data.integer[d % data.integer.length]});

    return {raw: utils.ndarrayOrder(data.raw, 0), variableNames: data.variableNames, integer: data.integer}
})()