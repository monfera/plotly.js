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
module.exports = function isArray(a) {
    return Array.isArray(a) || ArrayBuffer.isView(a);
}
