const assert = require('assert');
const rewire = require('rewire');

const ast = require('../src/ast');
const tk = require('../src/tokens');
const ec = require('../src/evaluation_context');
const tags = require('../src/tags');
const ds = require('../src/data_store');
const ops = require('../src/operators');

const eval = rewire('../src/evaluate');

const dfsEvaluate = eval.__get__('dfsEvaluate');

const testTags = [
  {
    id: 1,
    name: 'tag1'
  },
  {
    id: 2,
    name: 'tagA'
  },
  {
    id: 3,
    name: 'tag2'
  },
  {
    id: 4,
    name: 'tagA'
  },
];
const testEdges = [
  {
    from: 1,
    to: 2,
  },
  {
    from: 1,
    to: 3,
  },
];

const hierarchy = tags.TagHierarchy.createFromEdgeList(testEdges, testTags);
const dataStore = ds.DataStore.fromUnsortedIndex({
  1: [11, 12, 17],
  2: [12, 13],
  3: [11, 13],
  4: [15, 16, 17]
})
const context = new ec.EvaluationContext(hierarchy, dataStore);

describe('single tag AST', function () {

  it('should evaluate to the correct data ids', function() {
    const testAST = new ast.Node(new tk.Token(0, 1, 'tag1', tk.TokenType.TAG));
    const result = dfsEvaluate(testAST, context);
    assert.deepStrictEqual(result.getDataIds(context), [11, 12, 17]);
  });

  it('should return nothing when the tag does not exist', function() {
    const falseAST = new ast.Node(new tk.Token(0, 1, 'nope', tk.TokenType.TAG));
    const result = dfsEvaluate(falseAST, context);
    assert.deepStrictEqual(result.getDataIds(context), []);
  });
});

describe('single conjunction AST', function() {
  const testAST = new ast.Node(new tk.Token(0, 1, 'and', tk.TokenType.OPERATOR), ops.Operators.and);
  testAST.addChild(new ast.Node(new tk.Token(10, 12, 'tag1', tk.TokenType.TAG)));
  testAST.addChild(new ast.Node(new tk.Token(13, 15, 'tagA', tk.TokenType.TAG)));

  it('should evaluate to the correct data ids', function() {
    const result = dfsEvaluate(testAST, context);
    assert.deepStrictEqual(result.getDataIds(context), [12, 17]);
  });
});

describe('single union AST', function() {
  const testAST = new ast.Node(new tk.Token(0, 1, 'or', tk.TokenType.OPERATOR), ops.Operators.or);
  testAST.addChild(new ast.Node(new tk.Token(10, 12, 'tag1', tk.TokenType.TAG)));
  testAST.addChild(new ast.Node(new tk.Token(13, 15, 'tagA', tk.TokenType.TAG)));

  it('should evaluate to the correct data ids', function() {
    const result = dfsEvaluate(testAST, context);
    assert.deepStrictEqual(result.getDataIds(context), [11, 12, 13, 15, 16, 17]);
  });
});

describe('single negation AST', function() {
  const testAST = new ast.Node(new tk.Token(0, 1, 'not', tk.TokenType.OPERATOR), ops.Operators.not);
  testAST.addChild(new ast.Node(new tk.Token(13, 15, 'tagA', tk.TokenType.TAG)));

  it('should evaluate to the correct data ids', function() {
    const result = dfsEvaluate(testAST, context);
    assert.deepStrictEqual(result.getDataIds(context), [11]);
  });
});

describe('single tag explosion AST', function() {
  it('should evaluate to the subtree data ids for root explosion', function() {
    const deepAST = new ast.Node(new tk.Token(0, 1, '*', tk.TokenType.OPERATOR), ops.Operators['*']);
    deepAST.addChild(new ast.Node(new tk.Token(13, 15, 'tag1', tk.TokenType.TAG)));

    const result = dfsEvaluate(deepAST, context);
    assert.deepStrictEqual(result.getDataIds(context), [11, 12, 13, 17]);
  });

  it('should evaluate to the leaf data ids for leaf explosion', function() {
    const deepAST = new ast.Node(new tk.Token(0, 1, '*', tk.TokenType.OPERATOR), ops.Operators['*']);
    deepAST.addChild(new ast.Node(new tk.Token(13, 15, 'tagA', tk.TokenType.TAG)));

    const result = dfsEvaluate(deepAST, context);
    assert.deepStrictEqual(result.getDataIds(context), [12, 13, 15, 16, 17]);
  });
});

describe('single tag pathing AST', function() {
  it('should identify the uniquely pathed tagged data', function() {
    const deepAST = new ast.Node(new tk.Token(0, 1, '>', tk.TokenType.OPERATOR), ops.Operators['>']);
    deepAST.addChild(new ast.Node(new tk.Token(13, 15, 'tag1', tk.TokenType.TAG)));
    deepAST.addChild(new ast.Node(new tk.Token(16, 17, 'tag2', tk.TokenType.TAG)));

    const result = dfsEvaluate(deepAST, context);
    assert.deepStrictEqual(result.getDataIds(context), [11, 13]);
  });

  it('should identify the uniquely pathed tagged data among duplicate tag names', function() {
    const deepAST = new ast.Node(new tk.Token(0, 1, '>', tk.TokenType.OPERATOR), ops.Operators['>']);
    deepAST.addChild(new ast.Node(new tk.Token(13, 15, 'tag1', tk.TokenType.TAG)));
    deepAST.addChild(new ast.Node(new tk.Token(13, 15, 'tagA', tk.TokenType.TAG)));

    const result = dfsEvaluate(deepAST, context);
    assert.deepStrictEqual(result.getDataIds(context), [12, 13]);
  });

  it('should identify no data for invalid paths', function() {
    const deepAST = new ast.Node(new tk.Token(0, 1, '>', tk.TokenType.OPERATOR), ops.Operators['>']);
    deepAST.addChild(new ast.Node(new tk.Token(13, 15, 'tagA', tk.TokenType.TAG)));
    deepAST.addChild(new ast.Node(new tk.Token(13, 15, 'tag2', tk.TokenType.TAG)));

    const result = dfsEvaluate(deepAST, context);
    assert.deepStrictEqual(result.getDataIds(context), []);
  });
});

// TODO test for how missing tags are handled