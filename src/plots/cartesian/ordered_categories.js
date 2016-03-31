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
 * TODO add documentation
 */
module.exports = function orderedCategories(axisLetter, categorymode, categorylist, data) {
    
    return categorymode === 'array' ?
        
        // just return a copy of the specified array ...
        categorylist.slice() :
        
        // ... or take the union of all encountered tick keys and sort them as specified
        // (could be simplified with lodash-fp or ramda)
        [].concat.apply([], data.map(function(d) {return d[axisLetter]}))
            .filter(function(element, index, array) {return index === array.indexOf(element);})
            .sort(({
                'category ascending':  d3.ascending,
                'category descending': d3.descending
            })[categorymode]);
};
