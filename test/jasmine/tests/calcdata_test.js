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

    describe('category ordering', function() {

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

            // TODO augment test cases with selection on the DOM to ensure that ticks are there in proper order

            it('should output categories in ascending domain alphanumerical order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category ascending'
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
            });

            it('should output categories in descending domain alphanumerical order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category descending'
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 4, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 0, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 3, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 1, y: 14}));
            });

            it('should output categories in categorymode order even if category array is defined', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category ascending',
                    categorylist: ['b','a','d','e','c'] // These must be ignored. Alternative: error?
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
            });

            it('should output categories in ascending domain alphanumerical order, excluding undefined', function() {

                Plotly.plot(gd, [{x: ['c',undefined,'e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category ascending'
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 1, y: 15}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
            });
        });

        xdescribe('codomain numerical category ordering', function() {

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

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 4, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
            });

            it('should output categories in explicitly supplied order, independent of trace order, pruned', function() {

                Plotly.plot(gd, [{x: ['c',undefined,'e','b','d'], y: [15,11,12,null,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','a','d','e','c']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 4, y: 15}));
                expect(gd.calcdata[0][1]).toEqual({ x: false, y: false});
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                expect(gd.calcdata[0][3]).toEqual({ x: false, y: false});
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
            });

            it('should output categories in explicitly supplied order even if not all categories are present', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','x','a','d','z','e','c']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 6, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 2, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 5, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
            });

            it('should output categories in explicitly supplied order even if some missing categories were at the beginning or end of categorylist', function() {

                // The auto-range feature currently eliminates unutilized category ticks on the left/right edge

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['y','b','x','a','d','z','e','c', 'q', 'k']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 7, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 3, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 6, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 4, y: 14}));
            });

            it('should output categories in explicitly supplied order even if not all categories are present, and should interact with a null value orthogonally', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,null,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','x','a','d','z','e','c']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 6, y: 15}));
                expect(gd.calcdata[0][1]).toEqual({x: false, y: false});
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 5, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
            });

            it('should output categories in explicitly supplied order first, if not all categories are covered', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','a','x','c']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 3, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 5, y: 14}));

                // The order of the rest is unspecified, no need to check. Alternative: make _both_ categorymode and
                // categories effective; categories would take precedence and the remaining items would be sorted
                // based on the categorymode. This of course means that the mere presence of categories triggers this
                // behavior, rather than an explicit 'explicit' categorymode.
            });
        });
    });
});
