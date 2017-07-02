/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var table = require('./render');

module.exports = function plot(gd, cdTable) {

    var fullLayout = gd._fullLayout;
    var svg = fullLayout._paper;
    var root = fullLayout._paperdiv;

    var gdColumns = {};
    var gdColumnsOriginalOrder = {};

    var size = fullLayout._size;

    cdTable.forEach(function(d, i) {
        gdColumns[i] = gd.data[i].labels;
        gdColumnsOriginalOrder[i] = gd.data[i].labels.slice();
    });

    var hover = function(eventData) {
        gd.emit('plotly_hover', eventData);
    };

    var unhover = function(eventData) {
        gd.emit('plotly_unhover', eventData);
    };

    var columnMoved = function(i, indices) {
        
        function newIdx(indices, orig, dim) {
            var origIndex = orig.indexOf(dim);
            var currentIndex = indices.indexOf(origIndex);
            if(currentIndex === -1) {
                currentIndex += orig.length;
            }
            return currentIndex;
        }

        function sorter(orig) {
            return function sorter(d1, d2) {
                var i1 = newIdx(indices, orig, d1);
                var i2 = newIdx(indices, orig, d2);
                return i1 - i2;
            };
        }

        // drag&drop sorting of the columns
        var orig = sorter(gdColumnsOriginalOrder[i].filter(function(d, i) {return }));
        gdColumns[i].sort(orig);

        gdColumnsOriginalOrder[i].slice()
             .sort(function(d) {
                 // subsequent splicing to be done left to right, otherwise indices may be incorrect
                 return gdColumnsOriginalOrder[i].indexOf(d);
             })
            .forEach(function(d) {
                gdColumns[i].splice(gdColumns[i].indexOf(d), 1); // remove from the end
                gdColumns[i].splice(gdColumnsOriginalOrder[i].indexOf(d), 0, d); // insert at original index
            });

        gd.emit('plotly_restyle');
    };

    table(
        root,
        svg,
        cdTable,
        {
            width: size.w,
            height: size.h,
            margin: {
                t: size.t,
                r: size.r,
                b: size.b,
                l: size.l
            }
        },
        {
            hover: hover,
            unhover: unhover,
            columnMoved: columnMoved
        });
};
