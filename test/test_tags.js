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
  const oneIx = hierarchy.getIndices('tag1');
  const twoIx = hierarchy.getIndices('tag2');
  const threeIx = hierarchy.getIndices('tag3');
  const fourIx = hierarchy.getIndices('tag4');

  it('should properly explode tags', function () {
    assert.ok(utils.setEqual(new Set(hierarchy.explode(oneIx)), new Set([oneIx[0],
      twoIx[0],
      threeIx[0],
      fourIx[0]])));
    assert.ok(utils.setEqual(new Set(hierarchy.explode(twoIx)), new Set([ twoIx[0], fourIx[0]])));
    assert.ok(utils.setEqual(new Set(hierarchy.explode(fourIx)), new Set(fourIx)));
  });

  it('should properly identify paths', function () {
    assert.deepStrictEqual(hierarchy.getIndicesForPath([]), []);
    assert.ok(utils.setEqual(new Set(hierarchy.getIndicesForPath([oneIx])), new Set(oneIx)));

    assert.ok(utils.setEqual(new Set(hierarchy.getIndicesForPath([oneIx, twoIx])), new Set(twoIx)));
    // paths that don't exist should yield no indices
    assert.deepStrictEqual(hierarchy.getIndicesForPath([oneIx, fourIx]), []);
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
  const oneIx = hierarchy.getIndices('tag1');
  const aIx = hierarchy.getIndices('dupeA');
  const bIx = hierarchy.getIndices('dupeB');
  const threeIx = hierarchy.getIndices('tag3');
  const sixIx = hierarchy.getIndices('tag6');
  const sevenIx = hierarchy.getIndices('tag7');

  it('should properly explode unique tags', function () {
    // a leaf should explode only to itself
    assert.ok(utils.setEqual(new Set(hierarchy.explode(sevenIx)), new Set(sevenIx)));
  });

  it('should properly explode non-unique tags', function () {
    assert.deepStrictEqual(hierarchy.explode([]), []);

    const aExplosion = new Set(hierarchy.explode(aIx));
    // the explosion should contain the 2 dupeAs, 2 dupeBs, tag6 & tag7
    assert.ok(utils.setEqual(aExplosion, new Set([...aIx, ...bIx, ...sixIx, ...sevenIx])));
  });

  it('should properly identify paths', function () {
    const uniqueA = new Set(hierarchy.getIndicesForPath([oneIx, threeIx, aIx]));
    assert.ok(utils.setEqual(uniqueA, new Set([aIx[1]])));

    const allAToB = new Set(hierarchy.getIndicesForPath([aIx, bIx]));
    assert.ok(utils.setEqual(allAToB, new Set(bIx)));
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
  const oneIx = hierarchy.getIndices('tag1');
  const twoIx = hierarchy.getIndices('tag2');
  const threeIx = hierarchy.getIndices('tag3');

  it('should explode properly', function () {
    // due to the cycle, exploding these should lead to a BFS of all tags
    assert.ok(utils.setEqual(new Set(hierarchy.explode(oneIx)), new Set([...oneIx, ...twoIx, ...threeIx])));
    assert.ok(utils.setEqual(new Set(hierarchy.explode(threeIx)), new Set([...oneIx, ...twoIx, ...threeIx])));

    // this tag has no out edges, so doesn't explode
    assert.ok(utils.setEqual(new Set(hierarchy.explode(twoIx)), new Set(twoIx)));
  });

  it('should path properly', function () {
    const oneThree = new Set(hierarchy.getIndicesForPath([oneIx, threeIx]));
    assert.ok(utils.setEqual(oneThree, new Set(threeIx)));

    const threeOne = new Set(hierarchy.getIndicesForPath([threeIx, oneIx]));
    assert.ok(utils.setEqual(threeOne, new Set(oneIx)));

    const twoPath = new Set(hierarchy.getIndicesForPath([oneIx, twoIx]));
    assert.ok(utils.setEqual(twoPath, new Set(twoPath)));
  });
});