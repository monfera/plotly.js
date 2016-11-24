var utils = require('./utils');

module.exports = (function() {

    //var unsortedData = require('./mocks/raw/DVN');
    //var unsortedData = require('./mocks/raw/LDG');
    //var unsortedData = require('./mocks/raw/MCT');
    //var unsortedData = require('./mocks/raw/PDS');
    //var unsortedData = require('./mocks/out5d');
    var data = require('./mocks/k26');
    //var unsortedData = require('./mocks/column/LDG');

    //unsortedData = utils.widen(unsortedData, 48)

    return {raw: utils.ndarrayOrder(data.raw), variableNames: data.variableNames, integer: data.integer}
})()