/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env mocha */

const assert = require('assert');
const CustomMap = require('../../lib/custom-map.js');

describe('CustomMap', () => {
  it('creates a map', () => {
    const map = new CustomMap((a, b) => a === b);
    assert.equal(map.has(1), false);
    assert.equal(map.get(1), undefined);
    map.set(1, 2);
    assert.equal(map.has(1), true);
    assert.equal(map.get(1), 2);
  });

  it('uses custom equality function', () => {
    // create a map which stores 1 value per type
    const map = new CustomMap((a, b) => typeof a === typeof b);
    map.set(true, 1);
    map.set('foo', 2);
    map.set({}, 3);
    map.set('bar', 4);

    assert.equal(map.has(1), false);
    assert.equal(map.has(false), true);
    assert.equal(map.has(''), true);
    assert.equal(map.has({x: 1}), true);
    assert.equal(map.get('foo'), 4);
  });

  it('is not hella slow', () => {
    const map = new CustomMap(CustomMap.deepEquals);
    for (let i = 0; i < 100; i++) {
      map.set({i}, i);
    }

    for (let j = 0; j < 10000; j++) {
      const i = j % 100;
      assert.equal(map.get({i}), i);
    }
  });

  describe('#deepEquals', () => {
    it('works for simple types', () => {
      assert.ok(CustomMap.deepEquals(null, null));
      assert.ok(CustomMap.deepEquals(1, 1));
      assert.ok(CustomMap.deepEquals('x', 'x'));
      assert.ok(CustomMap.deepEquals(undefined, undefined));
      assert.ok(!CustomMap.deepEquals(1, 2));
      assert.ok(!CustomMap.deepEquals(0, ''));
      assert.ok(!CustomMap.deepEquals(true, 1));
    });

    it('works for arrays', () => {
      assert.ok(CustomMap.deepEquals([], []));
      assert.ok(CustomMap.deepEquals([1, 2], [1, 2]));
      assert.ok(CustomMap.deepEquals([null, [1]], [null, [1]]));
      assert.ok(!CustomMap.deepEquals([], [undefined]));
      assert.ok(!CustomMap.deepEquals([1], []));
      assert.ok(!CustomMap.deepEquals([1], {0: 1}));
    });

    it('works for objects', () => {
      assert.ok(CustomMap.deepEquals({}, {}));
      assert.ok(CustomMap.deepEquals({x: 1}, {x: 1}));
      assert.ok(CustomMap.deepEquals({nested: {x: 1}}, {nested: {x: 1}}));
      assert.ok(!CustomMap.deepEquals({nested: {x: 1}}, {nested: {y: 1}}));
      assert.ok(!CustomMap.deepEquals({x: 1}, {x: 1, y: 1}));
      assert.ok(!CustomMap.deepEquals({x: 1, y: 1}, {x: 1}));
    });

    it('handles for cirucular references', () => {
      const objA = {};
      const objB = {foo: objA};
      objA.foo = objB;

      assert.ok(!CustomMap.deepEquals(objA, objB));
    });
  });
});
