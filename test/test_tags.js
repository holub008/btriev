const tg = require('../src/tags');

describe('tag hierarchy', function () {
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

  it('can be constructed correctly for a depth 2 tree', function () {
    const hierarchy = tg.TagHierarchy.createFromEdgeList(edges, tags);
    //assert.equal(hierarchy.);
  });
});