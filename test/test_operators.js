const assert = require('assert');
const rewire = require("rewire");

const ops = rewire("../../btriev/src/operators.js");

describe('union operation', function () {
  const union = ops.__get__('union');
  it('should handle empty arrays', function() {
    const eeResult = union([], []);
    assert.deepStrictEqual(eeResult, []);

    const neResult = union([10, 11],[]);
    assert.deepStrictEqual(neResult, [10, 11]);

    const enResult = union([],[13, 14]);
    assert.deepStrictEqual(enResult, [13, 14]);
  });

  it('should handle nonempty arrays', function() {
    const uniqueResults = union([11, 12, 13], [14, 15, 16]);
    assert.deepStrictEqual(uniqueResults, [11, 12, 13, 14, 15, 16]);

    const nonUniqueResults = union([11, 12, 13], [5, 12, 13, 14]);
    assert.deepStrictEqual(nonUniqueResults, [5, 11, 12, 13, 14]);
  });
});

describe('intersect operation', function () {
  const intersect = ops.__get__('intersect');

  it('should handle empty arrays', function() {
    const eeResult = intersect([], []);
    assert.deepStrictEqual(eeResult, []);

    const neResult = intersect([10, 11],[]);
    assert.deepStrictEqual(neResult, []);

    const enResult = intersect([],[13, 14]);
    assert.deepStrictEqual(enResult, []);
  });

  it('should handle nonempty arrays', function() {
    const uniqueResults = intersect([11, 12, 13], [14, 15, 16]);
    assert.deepStrictEqual(uniqueResults, []);

    const nonUniqueResults = intersect([11, 12, 13], [5, 12, 13, 14]);
    assert.deepStrictEqual(nonUniqueResults, [12, 13]);
  });
});

describe('negate operation', function () {
  const negate = ops.__get__('negate');

  it('should handle empty arrays', function() {
    const eeResult = negate([], []);
    assert.deepStrictEqual(eeResult, []);

    const enResult = negate([],[13, 14]);
    assert.deepStrictEqual(enResult, [13, 14]);
  });

  it('should handle nonempty arrays', function() {
    const results1 = negate([15, 16], [14, 15, 16]);
    assert.deepStrictEqual(results1, [14]);

    const results2 = negate([11, 12, 13, 15], [5, 11, 12, 13, 14, 15]);
    assert.deepStrictEqual(results2, [5, 14]);
  });
});