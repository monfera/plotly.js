var Plotly = require('@lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('calculated data and points', function() {

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    describe('connectGaps', function() {

        it('should exclude null and undefined points when false', function() {
            Plotly.plot(gd, [{ x: [1,2,3,undefined,5], y: [1,null,3,4,5]}], {});

            expect(gd.calcdata[0][1]).toEqual({ x: false, y: false});
            expect(gd.calcdata[0][3]).toEqual({ x: false, y: false});
        });

        it('should exclude null and undefined points as categories when false', function() {
            Plotly.plot(gd, [{ x: [1,2,3,undefined,5], y: [1,null,3,4,5] }], { xaxis: { type: 'category' }});

            expect(gd.calcdata[0][1]).toEqual({ x: false, y: false});
            expect(gd.calcdata[0][3]).toEqual({ x: false, y: false});
        });
    });

    xdescribe('category ordering', function() {

        describe('default category ordering reified', function() {

            it('should output categories in the given order by default', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category'
                }});

                expect(gd.calcdata[0][0].y).toEqual(15);
                expect(gd.calcdata[0][1].y).toEqual(11);
                expect(gd.calcdata[0][2].y).toEqual(12);
                expect(gd.calcdata[0][3].y).toEqual(13);
                expect(gd.calcdata[0][4].y).toEqual(14);
            });

            it('should output categories in the given order if `trace` order is explicitly specified', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'trace'
                    // Also, if axis tick order is made configurable, shouldn't we make trace order configurable?
                    // Trace order as in, if a line or curve is drawn through points, what's the trace sequence.
                    // These are two orthogonal concepts. Currently, the trace order is implied
                    // by the order the {x,y} arrays are specified.
                }});

                expect(gd.calcdata[0][0].y).toEqual(15);
                expect(gd.calcdata[0][1].y).toEqual(11);
                expect(gd.calcdata[0][2].y).toEqual(12);
                expect(gd.calcdata[0][3].y).toEqual(13);
                expect(gd.calcdata[0][4].y).toEqual(14);
            });
        });

        describe('domain alphanumerical category ordering', function() {

            it('should output categories in ascending domain alphanumerical order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category ascending'
                }});

                expect(gd.calcdata[0][0].y).toEqual(11);
                expect(gd.calcdata[0][1].y).toEqual(13);
                expect(gd.calcdata[0][2].y).toEqual(15);
                expect(gd.calcdata[0][3].y).toEqual(14);
                expect(gd.calcdata[0][4].y).toEqual(12);
            });

            it('should output categories in descending domain alphanumerical order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category descending'
                }});

                expect(gd.calcdata[0][0].y).toEqual(12);
                expect(gd.calcdata[0][1].y).toEqual(14);
                expect(gd.calcdata[0][2].y).toEqual(15);
                expect(gd.calcdata[0][3].y).toEqual(13);
                expect(gd.calcdata[0][4].y).toEqual(11);
            });

            it('should output categories in categorymode order even if category array is defined', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category ascending',
                    categorylist: ['b','a','d','e','c'] // These must be ignored. Alternative: error?
                }});

                expect(gd.calcdata[0][0].y).toEqual(11);
                expect(gd.calcdata[0][1].y).toEqual(13);
                expect(gd.calcdata[0][2].y).toEqual(15);
                expect(gd.calcdata[0][3].y).toEqual(14);
                expect(gd.calcdata[0][4].y).toEqual(12);
            });

            it('should output categories in ascending domain alphanumerical order, excluding undefined', function() {

                Plotly.plot(gd, [{x: ['c',undefined,'e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category ascending'
                }});

                expect(gd.calcdata[0][0].y).toEqual(11);
                expect(gd.calcdata[0][1].y).toEqual(15);
                expect(gd.calcdata[0][2].y).toEqual(14);
                expect(gd.calcdata[0][3].y).toEqual(12);
            });
        });

        describe('codomain numerical category ordering', function() {

            it('should output categories in ascending codomain numerical order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'value ascending'
                }});

                expect(gd.calcdata[0][0].y).toEqual(11);
                expect(gd.calcdata[0][1].y).toEqual(12);
                expect(gd.calcdata[0][2].y).toEqual(13);
                expect(gd.calcdata[0][3].y).toEqual(14);
                expect(gd.calcdata[0][4].y).toEqual(15);
            });

            it('should output categories in descending codomain numerical order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'value descending'
                }});

                expect(gd.calcdata[0][0].y).toEqual(15);
                expect(gd.calcdata[0][1].y).toEqual(14);
                expect(gd.calcdata[0][2].y).toEqual(13);
                expect(gd.calcdata[0][3].y).toEqual(12);
                expect(gd.calcdata[0][4].y).toEqual(11);
            });

            it('should output categories in descending codomain numerical order, excluding nulls', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,null,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'value descending'
                }});

                expect(gd.calcdata[0][0].y).toEqual(15);
                expect(gd.calcdata[0][1].y).toEqual(14);
                expect(gd.calcdata[0][2].y).toEqual(12);
                expect(gd.calcdata[0][3].y).toEqual(11);

            });
        });

        describe('explicit category ordering', function() {

            it('should output categories in explicitly supplied order, independent of trace order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','a','d','e','c']
                }});

                expect(gd.calcdata[0][0].y).toEqual(13);
                expect(gd.calcdata[0][1].y).toEqual(11);
                expect(gd.calcdata[0][2].y).toEqual(14);
                expect(gd.calcdata[0][3].y).toEqual(12);
                expect(gd.calcdata[0][4].y).toEqual(15);
            });

            it('should output categories in explicitly supplied order, independent of trace order, pruned', function() {

                Plotly.plot(gd, [{x: ['c',undefined,'e','b','d'], y: [15,11,12,null,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','a','d','e','c']
                }});

                expect(gd.calcdata[0][0].y).toEqual(13);
                expect(gd.calcdata[0][1].y).toEqual(14);
                expect(gd.calcdata[0][2].y).toEqual(15);
            });

            it('should output categories in explicitly supplied order even if not all categories are present', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['y','b','x','a','d','z','e','c']
                }});

                expect(gd.calcdata[0][0].y).toEqual(null);
                expect(gd.calcdata[0][1].y).toEqual(13);
                expect(gd.calcdata[0][2].y).toEqual(null);
                expect(gd.calcdata[0][3].y).toEqual(11);
                expect(gd.calcdata[0][4].y).toEqual(14);
                expect(gd.calcdata[0][5].y).toEqual(null);
                expect(gd.calcdata[0][6].y).toEqual(12);
                expect(gd.calcdata[0][7].y).toEqual(15);
            });

            it('should output categories in explicitly supplied order first, if not all categories are covered', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','a','x','c']
                }});

                expect(gd.calcdata[0][0].y).toEqual(13);
                expect(gd.calcdata[0][1].y).toEqual(11);
                expect(gd.calcdata[0][2].y).toEqual(null);
                expect(gd.calcdata[0][3].y).toEqual(15);

                // The order of the rest is unspecified, no need to check. Alternative: make _both_ categorymode and
                // categories effective; categories would take precedence and the remaining items would be sorted
                // based on the categorymode. This of course means that the mere presence of categories triggers this
                // behavior, rather than an explicit 'explicit' categorymode.
            });
        });
    });
});
