/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * @fileoverview This class is designed to allow maps with arbitrary equality functions.
 * It is not meant to be performant and is well-suited to use cases where the number of entries is
 * likely to be small (like computed artifacts).
 */
module.exports = class CustomMap {
  constructor(equalsFn) {
    this._equalsFn = equalsFn;
    this._entries = [];
  }

  has(key) {
    return this._findIndexOf(key) !== -1;
  }

  get(key) {
    const entry = this._entries[this._findIndexOf(key)];
    return entry && entry.value;
  }

  set(key, value) {
    let index = this._findIndexOf(key);
    if (index === -1) index = this._entries.length;
    this._entries[index] = {key, value};
  }

  _findIndexOf(key) {
    for (let i = 0; i < this._entries.length; i++) {
      if (this._equalsFn(key, this._entries[i].key)) return i;
    }

    return -1;
  }

  static deepEquals(objA, objB, maxDepth = 5) {
    if (objA === objB) return true;
    if (maxDepth < 0) return false;
    if (typeof objA !== typeof objB) return false;
    if (typeof objA !== 'object') return false;
    if (Boolean(objA) !== Boolean(objB)) return false;
    if (!objA && !objB) return true;

    if (Array.isArray(objA)) {
      if (!Array.isArray(objB) || objA.length !== objB.length) return false;
      return !objA.find((itemA, index) => !CustomMap.deepEquals(itemA, objB[index], maxDepth - 1));
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (!CustomMap.deepEquals(keysA, keysB)) return false;

    return !keysA.find(key => !CustomMap.deepEquals(objA[key], objB[key], maxDepth - 1));
  }
};
