const assert = require('assert');

const ds = require('../src/data_store');

describe('data store static ctor', function() {
  it('should handle unordered, duplicated data ids', function() {
    const store = ds.DataStore.fromUnsortedIndex({
      11: [1, 2, 3, 3],
      12: [5, 4],
      13: [3, 5, 5, 4]
    });

    assert.deepStrictEqual(store.getAllDataIds(), [1, 2, 3, 4, 5]);
    assert.deepStrictEqual(store.getDataIdsForTagIds([11]), [1, 2, 3]);
    assert.deepStrictEqual(store.getDataIdsForTagIds([12]), [4, 5]);
    assert.deepStrictEqual(store.getDataIdsForTagIds([13]), [3, 4, 5]);
  });

  it('should handle unordered, duplicated data ids with all data ids', function() {
    const store = ds.DataStore.fromUnsortedIndex({
      11: [1, 2, 3, 3],
      12: [5, 4],
      13: [3, 5, 5, 4]
    }, [3, 4, 5, 5, 2, 1]);
    assert.deepStrictEqual(store.getAllDataIds(), [1, 2, 3, 4, 5]);
  });

  it('should throw for non-subset data', function() {
    assert.throws(() => ds.DataStore.fromUnsortedIndex({
      11: [1, 2, 3, 3],
      12: [5, 4],
      13: [3, 5, 5, 4]
    }, [1, 3, 2, 4]))
  });
});

describe('data store', function () {
  const data = ds.DataStore.fromUnsortedIndex({
    11: [3, 2, 1],
    12: [5],
    13: [3, 5]
  });
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