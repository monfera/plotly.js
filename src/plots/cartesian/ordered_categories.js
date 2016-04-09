/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

// flattenUnique :: String -> [[String]] -> Object
function flattenUnique(axisLetter, data) {
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
    return categoryMap;
}

// flattenUniqueSort :: String -> Function -> [[String]] -> [String]
function flattenUniqueSort(axisLetter, sortFunction, data) {
    return Object.keys(flattenUnique(axisLetter, data)).sort(sortFunction);
}


/**
 * This pure function returns the ordered categories for specified axisLetter, categorymode, categorylist and data.
 *
 * If categorymode is 'array', the result is a fresh copy of categorylist, or if unspecified, an empty array.
 *
 * If categorymode is 'category ascending' or 'category descending', the result is an array of ascending or descending
 * order of the unique categories encountered in the data for specified axisLetter.
 *
 * See cartesian/layout_attributes.js for the definition of categorymode and categorylist
 *
 */

// orderedCategories :: String -> String -> [String] -> [[String]] -> [String]
module.exports = function orderedCategories(axisLetter, categorymode, categorylist, data) {

    switch(categorymode) {
        case 'array': return Array.isArray(categorylist) ? categorylist : [];
        case 'category ascending': return flattenUniqueSort(axisLetter, d3.ascending, data);
        case 'category descending': return flattenUniqueSort(axisLetter, d3.descending, data);
        case 'trace': return [];
        default: return [];
    }
};
