const assert = require('assert');

const ds = require('../src/data_store');

describe('data store', function () {
  const data = ds.DataStore.fromUnsortedIndex({
    11: [1, 2, 3],
    12: [5],
    13: [3, 5]
  })
  it('should identify all data ids', function() {
    assert.deepStrictEqual(data.getAllDataIds(), [1, 2, 3, 5]);
  });

  it('should identify tagged data ids successfully', function() {
    assert.deepStrictEqual(data.getDataIdsForTagIds([11]), [1, 2, 3]);
    assert.deepStrictEqual(data.getDataIdsForTagIds([12]), [5]);
    assert.deepStrictEqual(data.getDataIdsForTagIds([13]), [3, 5]);
    assert.deepStrictEqual(data.getDataIdsForTagIds([14]), []);

    assert.deepStrictEqual(data.getDataIdsForTagIds([11, 12]), [1, 2, 3, 5]);
    assert.deepStrictEqual(data.getDataIdsForTagIds([11, 13]), [1, 2, 3, 5]);
    assert.deepStrictEqual(data.getDataIdsForTagIds([11, 12, 13]), [1, 2, 3, 5]);
  });
});

describe('data store with untagged data', function () {
  const data = ds.DataStore.fromUnsortedIndex({
    11: [1, 3, 2],
    12: [5, 4],
    13: [3, 5]
  }, [3, 2, 1, 4, 5, 1337, 1447])
  it('should identify all data ids', function() {
    assert.deepStrictEqual(data.getAllDataIds(), [1, 2, 3, 4, 5, 1337, 1447]);
  });

  it('should identify tagged data ids successfully', function() {
    assert.deepStrictEqual(data.getDataIdsForTagIds([11]), [1, 2, 3]);
    assert.deepStrictEqual(data.getDataIdsForTagIds([12]), [4, 5]);
    assert.deepStrictEqual(data.getDataIdsForTagIds([13]), [3, 5]);
    assert.deepStrictEqual(data.getDataIdsForTagIds([14]), []);

    assert.deepStrictEqual(data.getDataIdsForTagIds([11, 12]), [1, 2, 3, 4, 5]);
    assert.deepStrictEqual(data.getDataIdsForTagIds([11, 13]), [1, 2, 3, 5]);
    assert.deepStrictEqual(data.getDataIdsForTagIds([11, 12, 13]), [1, 2, 3, 4, 5]);
  });
});