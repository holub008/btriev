const assert = require('assert');
const utils = require('./utils');

const tg = require('../src/tags');

describe('depth 3 tag hierarchy with unique tag names', function () {
  const edges = [
    {
      from: 1,
      to: 2,
    },
    {
      from: 1,
      to: 3,
    },
    {
      from: 2,
      to: 4
    }
  ];

  const tags = [
    {
      id: 1,
      name: 'tag1',
    },
    {
      id: 2,
      name: 'tag2',
    },
    {
      id: 3,
      name: 'tag3',
    },
    {
      id: 4,
      name: 'tag4'
    },
  ];

  const hierarchy = tg.TagHierarchy.createFromEdgeList(edges, tags);

  it('should properly explode tags', function () {
    assert.ok(utils.setEqual(new Set(hierarchy.explode(1)), new Set([1, 2, 3, 4])));
    assert.ok(utils.setEqual(new Set(hierarchy.explode(2)), new Set([2, 4])));
    assert.ok(utils.setEqual(new Set(hierarchy.explode(4)), new Set([4])));
  });

  it('should properly identify paths', function () {
    assert.strictEqual(hierarchy.getIds('tag3'), [3]);

    assert.deepStrictEqual(hierarchy.getIdsForPath([]), []);
    assert.ok(utils.setEqual(new Set(hierarchy.getIdsForPath([[1]])), new Set([1])));

    assert.ok(utils.setEqual(new Set(hierarchy.getIdsForPath([[1], [2]])), new Set([2])));
    // paths that don't exist should yield no indices
    assert.deepStrictEqual(hierarchy.getIdsForPath([[1], [4]]), []);
  });
});

describe('depth 4 tag hierarchy with non-unique tag names', function () {
  const edges = [
    {
      from: 1,
      to: 2,
    },
    {
      from: 1,
      to: 3,
    },
    {
      from: 3,
      to: 4,
    },
    {
      from: 4,
      to: 5,
    },
    {
      from: 4,
      to: 6,
    },
    {
      from: 4,
      to: 7,
    },
    {
      from: 2,
      to: 8,
    },
  ];

  const tags = [
    {
      id: 1,
      name: 'tag1',
    },
    {
      id: 2,
      name: 'dupeA',
    },
    {
      id: 3,
      name: 'tag3',
    },
    {
      id: 4,
      name: 'dupeA'
    },
    {
      id: 5,
      name: 'dupeB'
    },
    {
      id: 6,
      name: 'tag6'
    },
    {
      id: 7,
      name: 'tag7'
    },
    {
      id: 8,
      name: 'dupeB'
    },
  ];

  const hierarchy = tg.TagHierarchy.createFromEdgeList(edges, tags);

  it('should properly explode unique tags', function () {
    // a leaf should explode only to itself
    assert.ok(utils.setEqual(new Set(hierarchy.explode(7)), new Set([7])));
  });

  it('should properly explode non-unique tags', function () {
    assert.deepStrictEqual(hierarchy.explode([]), []);

    const aExplosion = new Set(hierarchy.explode(4));
    // the explosion should contain the 2 dupeAs, 2 dupeBs, tag6 & tag7
    assert.ok(utils.setEqual(aExplosion, new Set([4, 8, 6, 7])));
  });

  it('should properly identify paths', function () {
    assert.ok(utils.setEqual(new Set(hierarchy.getIds('dupeA')), new Set([2, 4])))

    const uniqueA = new Set(hierarchy.getIdsForPath([[1], [3], [2, 4]]));
    assert.ok(utils.setEqual(uniqueA, new Set([4])));

    const allAToB = new Set(hierarchy.getIdsForPath([[2, 4], [5, 8]]));
    assert.ok(utils.setEqual(allAToB, new Set([5, 8])));
  });
});


describe('tag hierarchy with a loop', function () {
  const edges = [
    {
      from: 101,
      to: 102,
    },
    {
      from: 101,
      to: 103,
    },
    // here's the cycle
    {
      from: 103,
      to: 101,
    },
  ];

  const tags = [
    {
      id: 101,
      name: 'tag1',
    },
    {
      id: 102,
      name: 'tag2',
    },
    {
      id: 103,
      name: 'tag3',
    },
  ];

  const hierarchy = tg.TagHierarchy.createFromEdgeList(edges, tags);

  it('should explode properly', function () {
    // due to the cycle, exploding these should lead to a BFS of all tags
    assert.ok(utils.setEqual(new Set(hierarchy.explode(101)), new Set([101, 102, 103])));
    assert.ok(utils.setEqual(new Set(hierarchy.explode(103)), new Set([101, 102, 103])));

    // this tag has no out edges, so doesn't explode
    assert.ok(utils.setEqual(new Set(hierarchy.explode(102)), new Set([102])));
  });

  it('should path properly', function () {
    const oneThree = new Set(hierarchy.getIdsForPath([[101], [103]]));
    assert.ok(utils.setEqual(oneThree, new Set([103])));

    const threeOne = new Set(hierarchy.getIdsForPath([[103], [101]]));
    assert.ok(utils.setEqual(threeOne, new Set([101])));

    const twoPath = new Set(hierarchy.getIdsForPath([[101], [102]]));
    assert.ok(utils.setEqual(twoPath, new Set([102])));
  });
});