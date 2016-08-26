'use strict';

var Plotly = require('@lib/index');

// Test utilities
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

function makePlot(gd, mock) {
    return Plotly.plot(gd, mock.data, mock.layout);
}

describe('pointcloud plots', function() {

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should make pointcloud plot without raising an error', function(done) {
        makePlot(gd, require('@mocks/gl2d_pointcloud-basic.json'))
            .then(null, failTest) // current linter balks on .catch with 'dot-notation'; fixme a linter
            .then(done);
    });

});
