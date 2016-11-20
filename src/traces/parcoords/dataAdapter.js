var utils = require('./utils');

module.exports = (function() {

    //var unsortedData = require('./mocks/raw/DVN');
    //var unsortedData = require('./mocks/raw/LDG');
    //var unsortedData = require('./mocks/raw/MCT');
    //var unsortedData = require('./mocks/raw/PDS');
    //var unsortedData = require('./mocks/out5d');
    var unsortedData = require('./mocks/k26');
    //unsortedData = utils.widen(unsortedData, 48)

    var data = utils.ndarrayOrder(unsortedData)

    return data
})()