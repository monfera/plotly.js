/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');


/**
 * This pure function returns the ordered categories for specified axisLetter, categorymode, categorylist and data.
 *
 * If categorymode is 'array', the result is a fresh copy of categorylist, or if unspecified, an empty array.
 *
 * If categorymode is 'category ascending' or 'category descending', the result is an array of ascending or descending
 * order of the unique categories encountered in the data for specified axisLetter.
 *
 */
module.exports = function orderedCategories(axisLetter, categorymode, categorylist, data) {

    if(categorymode === 'array') {
        // just return a copy of the specified array, if any
        return (Array.isArray(categorylist) ? categorylist : []).slice();
    } else if(['category ascending', 'category descending'].indexOf(categorymode) === -1) {
        return [].slice();
    } else {
        var traceLines = data.map(function(d) {return d[axisLetter];});
        var categoryMap = {}; // hashmap is O(1);
        var i, j, tracePoints, category;
        for(i = 0; i < traceLines.length; i++) {
            tracePoints = traceLines[i];
            for(j = 0; j < tracePoints.length; j++) {
                category = tracePoints[j];
                if(!categoryMap[category]) {
                    categoryMap[category] = true;
                }
            }
        }
        return Object.keys(categoryMap)
            .sort(({
                'category ascending': d3.ascending,
                'category descending': d3.descending
            })[categorymode]);
    }
};
