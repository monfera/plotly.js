var d3 = require('d3');

module.exports = function(variables) {

    variables.forEach(function(v) {
        var extent = d3.extent(v.values);
        if(extent[0] === extent[1]) {
            extent[0]--;
            extent[1]++;
        }
        var a = 1 / (extent[1] - extent[0]);
        var b = -a * extent[0];
        v.domainToUnitScale = function(x) {return a * x + b};
    });

    return variables
};