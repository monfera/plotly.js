var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('pie hovering', function() {
    var mock = require('@mocks/parcoords.json');

    describe('event data', function() {
        var mockCopy = Lib.extendDeep({}, mock),
            gd;

        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(Plotly.plot(gd, mockCopy.data, mockCopy.layout))
                .then(done);
        });

        afterEach(destroyGraphDiv);

        it('should work', function() {
        });
    });
});
