var utils = require('./utils');

module.exports = function(tuple) {

    var data = tuple.raw
    var variableCount = data.shape[0]
    var sampleCount = data.shape[1]
    var variableIds = utils.range(variableCount);
    var filters = variableIds.map(function() {return [0, 1]})
    var domains = utils.ndarrayDomains(data)
    var domainToUnitScales = domains.map(function(d) {
        var a = -1 / (d[1] - d[0])
        var b = 1 - a * d[0]
        return function(x) {return a * x + b}
    })
    return {
        data: data,
        variableCount: variableCount,
        sampleCount: sampleCount,
        domainToUnitScales: domainToUnitScales,
        filters: filters,
        variableNames: tuple.variableNames
    }
};