var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

describe('pie hovering', function() {
    var mock = require('@mocks/parcoords.json');
    // var mock = require('@mocks/gl2d_scatter-colorscale-colorbar.json');

    describe('event data', function() {
        var mockCopy = Lib.extendDeep({}, mock),
            // width = mockCopy.layout.width,
            // height = mockCopy.layout.height,
            gd;

        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(Plotly.plot(gd, mockCopy.data, mockCopy.layout))
                .then(done);
        });

        // afterEach(destroyGraphDiv);

        it('should contain the correct fields', function() {
            return;
            /*
             * expected = [{
             *         v: 4,
             *         label: '3',
             *         color: '#ff7f0e',
             *         i: 3,
             *         hidden: false,
             *         text: '26.7%',
             *         px1: [0,-60],
             *         pxmid: [-44.588689528643656,-40.14783638153149],
             *         midangle: -0.8377580409572781,
             *         px0: [-59.67131372209641,6.2717077960592],
             *         largeArc: 0,
             *         cxFinal: 200,
             *         cyFinal: 160
             *     }];
             */
        });

        it('should fire hover event when moving from one slice to another', function(done) {
            var count = 0,
                hoverData = [];

            gd.on('plotly_hover', function(data) {
                count++;
                hoverData.push(data);
            });

            mouseEvent('mouseover', 173, 133);
            setTimeout(function() {
                mouseEvent('mouseover', 233, 193);
                expect(count).toEqual(2);
                expect(hoverData[0]).not.toEqual(hoverData[1]);
                done();
            }, 100);
        });

        it('should fire unhover event when the mouse moves off the graph', function(done) {
            var count = 0,
                unhoverData = [];

            gd.on('plotly_unhover', function(data) {
                count++;
                unhoverData.push(data);
            });

            mouseEvent('mouseover', 173, 133);
            mouseEvent('mouseout', 173, 133);
            setTimeout(function() {
                mouseEvent('mouseover', 233, 193);
                mouseEvent('mouseout', 233, 193);
                expect(count).toEqual(2);
                expect(unhoverData[0]).not.toEqual(unhoverData[1]);
                done();
            }, 100);
        });
    });

    describe('labels', function() {

        var gd,
            mockCopy;

        beforeEach(function() {
            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);
        });

        afterEach(destroyGraphDiv);

        it('should show the default selected values', function(done) {

            var expected = ['4', '5', '33.3%'];

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                mouseEvent('mouseover', 223, 143);

                var labels = Plotly.d3.selectAll('.hovertext .nums .line');

                expect(labels[0].length).toBe(3);

                labels.each(function(_, i) {
                    expect(Plotly.d3.select(this).text()).toBe(expected[i]);
                });
            }).then(done);
        });

        it('should show the correct separators for values', function(done) {

            var expected = ['0', '12|345|678@91', '99@9%'];

            mockCopy.layout.separators = '@|';
            mockCopy.data[0].values[0] = 12345678.912;
            mockCopy.data[0].values[1] = 10000;

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {

                mouseEvent('mouseover', 223, 143);

                var labels = Plotly.d3.selectAll('.hovertext .nums .line');

                expect(labels[0].length).toBe(3);

                labels.each(function(_, i) {
                    expect(Plotly.d3.select(this).text()).toBe(expected[i]);
                });
            }).then(done);
        });
    });
});
