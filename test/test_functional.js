const assert = require('assert');

const btriev = require('../../btriev');

const edges = [
  {
    from: 11,
    to: 12,
  },
  {
    from: 11,
    to: 12,
  },
  {
    from: 11,
    to: 13,
  },
  {
    from: 11,
    to: 14,
  },
  {
    from: 13,
    to: 15,
  },
  {
    from: 15,
    to: 16,
  },
  {
    from: 14,
    to: 17,
  },
  {
    from: 14,
    to: 18,
  },
  {
    from: 14,
    to: 19,
  },
  {
    from: 19,
    to: 20,
  },
  {
    from: 19,
    to: 21,
  },
  {
    from: 22,
    to: 23,
  },
  {
    from: 22,
    to: 24,
  },
];

const tags = [
  {
    id: 11,
    name: 'tag1'
  },
  {
    id: 13,
    name: 'tag3'
  },
  {
    id: 12,
    name: 'tag2'
  },
  {
    id: 14,
    name: 'tag4'
  },
  {
    id: 15,
    name: 'tag5'
  },
  {
    id: 16,
    name: 'tag dupe A'
  },
  {
    id: 17,
    name: 'tag7'
  },
  {
    id: 18,
    name: 'tag8'
  },
  {
    id: 19,
    name: 'tag dupe A'
  },
  {
    id: 20,
    name: 'dupeB'
  },
  {
    id: 21,
    name: 'tag11'
  },
  {
    id: 22,
    name: 'tag12'
  },
  {
    id: 23,
    name: 'dupeB'
  },
  {
    id: 24,
    name: 'tag dupe A'
  },
]

const hierarchy = btriev.TagHierarchy.createFromEdgeList(edges, tags);

const index1 = {
  11: [103, 101],
  12: [102],
  13: [104, 105],
  14: [106],
  15: [101, 103],
  16: [107],
  17: [108, 109, 102],
  18: [108, 104, 110],
  20: [105, 101],
  21: [107, 103, 111, 106],
  22: [112, 109],
  23: [110, 111, 106],
  24: [103],
};

const data1 = btriev.DataStore.fromUnsortedIndex(index1);
const data2 = btriev.DataStore.fromUnsortedIndex(index1, [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 99]);

describe('query battery with dataset1', function () {
  const queryToResult = {
    'tag1 AND tag2': [],
    '"tag1" AND "tag2"': [],
    '"tag1" AND "tag2" or tag4': [106],
    'tag1 and (tag2 or tag5)': [101, 103],
    'tag1 and not (tag2 or tag5)': [],
    'tag12*': [103, 106, 109, 110, 111, 112],
    'not dupeB': [102, 103, 104, 107, 108, 109, 112],
    'tag12* and not dupeB': [103, 109, 112],
    'tag12 >dupeB Or tag1>"tag4">"tag dupe A"': [106, 110, 111],
  }

  it('should correctly execute', function() {
    Object.entries(queryToResult).forEach(([query, expectedResult], ix) => {
      console.log(ix);
      const dataIds = btriev.evaluate(query, data1, hierarchy);
      assert.deepStrictEqual(dataIds, expectedResult);
    })
  });
});