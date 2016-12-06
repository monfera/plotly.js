var d3 = require('d3');

module.exports = function(variables) {

    var variableCount = variables.length;
    var sampleCount = variables[0].values.length;
    var filters = variables.map(function() {return [0, 1]})
    var domains = variables.map(function(v) {
        var extent = d3.extent(v.values);
        if(extent[0] === extent[1]) {
            extent[0]--;
            extent[1]++;
        }
        return extent;
    });
    var domainToUnitScales = domains.map(function(d) {
        var a = 1 / (d[1] - d[0])
        var b = -a * d[0]
        return function(x) {return a * x + b}
    })
    return {
        variables: variables,
        domainToUnitScales: domainToUnitScales,
        filters: filters,
        variableNames: variables.map(function(v) {return v.variableName;}),
        integer: variables.map(function(v) {return v.integer;})
    }
};