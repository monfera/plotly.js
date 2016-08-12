/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/**
 * Truncate a Float32Array to some length. A wrapper to support environments
 * (e.g. node-webkit) that do not implement Float32Array.prototype.slice
 */
module.exports = function truncate(float32ArrayIn, len) {
    if(Float32Array.slice === undefined) {
        var float32ArrayOut = new Float32Array(len);
        for(var i = 0; i < len; i++) float32ArrayOut[i] = float32ArrayIn[i];
        return float32ArrayOut;
    }

    return float32ArrayIn.slice(0, len);
};
