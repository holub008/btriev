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
];

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
  const multilineQuery = `
      (
        (
          tag7 
          or 
          tag8
        ) 
        and 
        not tag12*
      )
      or
      "tag dupe A"
      or 
        tag1 >
        tag3 >
        tag5 *`;

  const queryToResult = {
    'tag1 AND tag2': [],
    '"tag1" AND "tag2"': [],
    '"tag1" AND "tag2" or tag4': [106],
    'tag1 and (tag2 or tag5)': [101, 103],
    'tag1 and not (tag2 or tag5)': [],
    'tag12*': [103, 106, 109, 110, 111, 112],
    'tag1 > tag3 > tag5': [101, 103],
    'not dupeB': [102, 103, 104, 107, 108, 109, 112],
    'tag12* and not dupeB': [103, 109, 112],
    'tag12 >dupeB Or tag1>"tag4">"tag dupe A"': [106, 110, 111],
    [multilineQuery]: [101, 102, 103, 104, 107, 108],
    'tag1   and "tag5" AND ((dupeB OR tag12))': [101],
  };

  it('should correctly execute', function() {
    Object.entries(queryToResult).forEach(([query, expectedResult], ix) => {
      console.log(ix);
      const dataIds = btriev.evaluate(query, data1, hierarchy);
      assert.deepStrictEqual(dataIds, expectedResult);
    })
  });
});

describe('query battery with dataset2', function () {
  const queryToResult = {
    'tag1 AND tag2': [],
    'tag12*': [103, 106, 109, 110, 111, 112],
    'tag1 > tag3 > tag5': [101, 103],
    'not dupeB': [99, 102, 103, 104, 107, 108, 109, 112, 113],
    'tag12* and not dupeB': [103, 109, 112],
  };

  it('should correctly execute', function() {
    Object.entries(queryToResult).forEach(([query, expectedResult], ix) => {
      console.log(ix);
      const dataIds = btriev.evaluate(query, data2, hierarchy);
      assert.deepStrictEqual(dataIds, expectedResult);
    })
  });
});

function assertExceptions(expectedResults, data, hierarchy) {
  expectedResults.forEach(er => {
    let exc = undefined;
    try {
      btriev.evaluate(er.query, data, hierarchy)
    }
    catch (e) {
      exc = e;
      console.log(e);
    }
    assert.ok(exc);
    assert.strictEqual(exc.message, er.message);
    assert.strictEqual(exc.getLocation()[0], er.start);
    assert.strictEqual(exc.getLocation()[1], er.end);
  });
}

describe('invalid queries', function () {
  it('mismatched open parens', function() {
    const queries = [
      {
        query: '(tag1 and tag2 or tag3',
        start: 0,
        end: 1,
        message: 'Unmatched open parenthesis',
      },
      {
        query: 'tag1 and (tag2 or tag3',
        start: 9,
        end: 10,
        message: 'Unmatched open parenthesis',
      },
      {
        query: 'tag1 and tag2 or tag3(',
        start: 21,
        end: 22,
        message: 'Unmatched open parenthesis',
      },
    ];
    // TODO
    //assertExceptions(queries, data1, hierarchy);
  });

  it('mismatched close parens', function() {
    const queries = [
      {
        query: ')tag1 and tag2 and tag3',
        start: 0,
        end: 0,
        message: 'Unmatched close parenthesis',
      },
      {
        query: 'tag1 and tag2) and tag3',
        start: 13,
        end: 13,
        message: 'Unmatched close parenthesis',
      },
      {
        query: 'tag1 and tag2 or tag3)',
        start: 21,
        end: 21,
        message: 'Unmatched close parenthesis',
      },
    ];
    assertExceptions(queries, data1, hierarchy);
  });

  it('exploding an expression', function() {
    const queries = [
      {
        query: '(tag1 and tag2)*',
        start: 15,
        end: 15,
        message: 'explode operator expects only tag operands',
      },
    ];
    assertExceptions(queries, data1, hierarchy);
  });

  it('pathing an expression', function() {
    const queries = [
      {
        query: '(tag1 and tag2)>tag3',
        start: 15,
        end: 15,
        message: 'path operator expects only tag operands',
      },
      {
        // technically either operator can be culpable - it's an implementation detail, but we attach it to the 2nd
        query: 'tag1>(tag1 and tag2)>tag3',
        start: 20,
        end: 20,
        message: 'path operator expects only tag operands',
      },
      {
        query: 'tag1>tag3 > (not tag1)',
        start: 10,
        end: 10,
        message: 'path operator expects only tag operands',
      },
    ];
    assertExceptions(queries, data1, hierarchy);
  });

  it('adjoining operators', function() {
    const queries = [
      {
        query: 'and or',
        start: 0,
        end: 2,
        message: 'Binary AND requires left and right expressions to operate on.',
      },
      {
        query: 'not and',
        start: 0,
        end: 2,
        message: 'Left unary operator NOT requires an expression to operate on',
      },
      {
        query: 'tag1 and *',
        start: 5,
        end: 7,
        message: 'Binary AND requires left and right expressions to operate on.',
      },
      {
        query: 'tag1> or *',
        start: 4,
        end: 4,
        message: 'Binary path operator requires left and right expressions to operate on.',
      },
    ];
    assertExceptions(queries, data1, hierarchy);
  });

  it('adjoining tags', function() {
    const queries = [
      {
        query: '"tag1" tag2',
        start: 7,
        end: 10,
        message: 'Expected an operator before tag',
      },
      {
        query: 'tag1 and "tag2" "tag3"',
        start: 16,
        end: 21,
        message: 'Expected an operator before tag',
      },
    ];
    assertExceptions(queries, data1, hierarchy);
  });

  it('trailing binary op', function() {
    const query1 = "tag1 or tag2 and";
    const query2 = "tag1 and tag2 or";

  });

  it('leading binary op', function() {
    const query1 = ">tag1";
    const query2 = "and tag1";
    const query3 = "or tag1 and tag2";

  });

  it('unary op no operand', function() {
    const query1 = "*";
    const query2 = "not";
  });

  it('binary op no operands', function() {
    const query1 = '>';
    const query2 = 'or';
  });

  it('nonexistant tag', function() {

  });
});