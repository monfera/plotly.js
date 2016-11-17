var utils = require('./utils');
var k26 = require('./mocks/k26');
var out5d = require('./mocks/out5d');

module.exports = (function() {

    //var unsortedData = out5d
    var unsortedData = k26
    //unsortedData = utils.widen(unsortedData, 48)

    var data = utils.ndarrayOrder(unsortedData)

    return data
})()