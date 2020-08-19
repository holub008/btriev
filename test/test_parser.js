const assert = require('assert');
const rewire = require('rewire');

const btriev = require('../../btriev');
const tokens = require('../../btriev/src/tokens');
const ast = require('../../btriev/src/ast');
const ops = require('../../btriev/src/operators');

const flattenPathing = rewire('../src/parser').__get__('flattenPathing');


describe('parsing an empty sequence', function () {
  const tokens = [];
  const parser = new btriev.Parser();
  it('should produce null', function () {
    assert.strictEqual(parser.parse(tokens), null);
  });
});

describe('parsing a single tag', function () {
  const tkSequence = [new tokens.Token(0, 1, 'tag1', tokens.TokenType.TAG)];
  const parser = new btriev.Parser();
  it('should produce a single root', function () {
    assert.ok(ast.nodesEqual(parser.parse(tkSequence), new ast.Node(tkSequence[0]), true));
  });
});

describe('parsing a single conjunction', function () {
  const tkSequence = [
    new tokens.Token(0, 1, 'tag1', tokens.TokenType.TAG),
    new tokens.Token(2, 3, 'and', tokens.TokenType.OPERATOR),
    new tokens.Token(4, 5, 'tag2', tokens.TokenType.TAG),
  ];
  const parser = new btriev.Parser();

  it('should produce a depth 1 AST', function () {
    const target = new ast.Node(tkSequence[1], ops.Operators.and);
    target.addChild(new ast.Node(tkSequence[0]));
    target.addChild(new ast.Node(tkSequence[2]));

    assert.ok(ast.nodesEqual(parser.parse(tkSequence), target, true));
  });
});

describe('parsing a union and then a conjunction', function () {
  const tkSequence = [
    new tokens.Token(0, 1, 'tag1', tokens.TokenType.TAG),
    new tokens.Token(2, 3, 'or', tokens.TokenType.OPERATOR),
    new tokens.Token(4, 5, 'tag2', tokens.TokenType.TAG),
    new tokens.Token(6, 7, 'and', tokens.TokenType.OPERATOR),
    new tokens.Token(8, 9, 'tag3', tokens.TokenType.TAG),
  ];
  const parser = new btriev.Parser();

  it('should produce a depth 2 AST', function () {
    const target = new ast.Node(tkSequence[1], ops.Operators.or);
    const targetAnd = new ast.Node(tkSequence[3], ops.Operators.and);
    targetAnd.addChild(new ast.Node(tkSequence[2]));
    targetAnd.addChild(new ast.Node(tkSequence[4]));

    target.addChild(new ast.Node(tkSequence[0]));
    target.addChild(targetAnd);

    assert.ok(ast.nodesEqual(parser.parse(tkSequence), target, true));
  });
});

describe('parsing a conjunction then a union', function () {
  const tkSequence = [
    new tokens.Token(0, 1, 'tag1', tokens.TokenType.TAG),
    new tokens.Token(2, 3, 'and', tokens.TokenType.OPERATOR),
    new tokens.Token(4, 5, 'tag2', tokens.TokenType.TAG),
    new tokens.Token(6, 7, 'or', tokens.TokenType.OPERATOR),
    new tokens.Token(8, 9, 'tag3', tokens.TokenType.TAG),
  ];
  const parser = new btriev.Parser();

  it('should produce a depth 2 AST', function () {
    const target = new ast.Node(tkSequence[3], ops.Operators.or);
    const targetAnd = new ast.Node(tkSequence[1], ops.Operators.and);
    targetAnd.addChild(new ast.Node(tkSequence[0]));
    targetAnd.addChild(new ast.Node(tkSequence[2]));

    target.addChild(targetAnd);
    target.addChild(new ast.Node(tkSequence[4]));

    assert.ok(ast.nodesEqual(parser.parse(tkSequence), target, true));
  });
});

describe('parsing a conjunction then a union with parens', function () {
  const tkSequence = [
    new tokens.Token(0, 1, 'tag1', tokens.TokenType.TAG),
    new tokens.Token(2, 3, 'and', tokens.TokenType.OPERATOR),
    new tokens.Token(4, 5, '(', tokens.TokenType.OPERATOR),
    new tokens.Token(6, 7, 'tag2', tokens.TokenType.TAG),
    new tokens.Token(8, 9, 'or', tokens.TokenType.OPERATOR),
    new tokens.Token(10, 11, 'tag3', tokens.TokenType.TAG),
    new tokens.Token(12, 13, ')', tokens.TokenType.OPERATOR),
  ];
  const parser = new btriev.Parser();

  const target = new ast.Node(tkSequence[1], ops.Operators.and);
  const targetOr = new ast.Node(tkSequence[4], ops.Operators.or);
  targetOr.addChild(new ast.Node(tkSequence[3]));
  targetOr.addChild(new ast.Node(tkSequence[5]));

  target.addChild(new ast.Node(tkSequence[0]));
  target.addChild(targetOr);

  it('should produce a depth 2 AST, even with parens', function () {
    assert.ok(ast.nodesEqual(parser.parse(tkSequence), target, true));
  });
});

describe('parsing a negation', function () {
  const tkSequence = [
    new tokens.Token(0, 1, 'not', tokens.TokenType.OPERATOR),
    new tokens.Token(2, 3, 'tag1', tokens.TokenType.TAG),
    new tokens.Token(4, 5, 'and', tokens.TokenType.OPERATOR),
    new tokens.Token(6, 7, 'tag2', tokens.TokenType.TAG),
  ];
  const parser = new btriev.Parser();

  const target = new ast.Node(tkSequence[2], ops.Operators.and);
  const targetNegation = new ast.Node(tkSequence[0], ops.Operators.not);
  targetNegation.addChild(new ast.Node(tkSequence[1]));

  target.addChild(targetNegation);
  target.addChild(new ast.Node(tkSequence[3]));

  it('should produce a depth 2 AST', function () {
    assert.ok(ast.nodesEqual(parser.parse(tkSequence), target, true));
  });
});

describe('parsing an explosion', function () {
  const tkSequence = [
    new tokens.Token(0, 1, 'not', tokens.TokenType.OPERATOR),
    new tokens.Token(2, 3, 'tag1', tokens.TokenType.TAG),
    new tokens.Token(4, 5, '*', tokens.TokenType.OPERATOR),
    new tokens.Token(6, 7, 'or', tokens.TokenType.OPERATOR),
    new tokens.Token(8, 9, 'tag2', tokens.TokenType.TAG),
  ];
  const parser = new btriev.Parser();

  const target = new ast.Node(tkSequence[3], ops.Operators.or);
  const negation = new ast.Node(tkSequence[0], ops.Operators.not);
  const explosion = new ast.Node(tkSequence[2], ops.Operators['*']);
  explosion.addChild(new ast.Node(tkSequence[1]));
  negation.addChild(explosion);

  target.addChild(negation);
  target.addChild(new ast.Node(tkSequence[4]));

  it('should produce a depth 3 AST', function () {
    assert.ok(ast.nodesEqual(parser.parse(tkSequence), target, true));
  });
});

describe('path flattening', function() {
  it('should do nothing to a two tag path', function() {
    const opTk = new tokens.Token(1, 2, '>', tokens.TokenType.OPERATOR);
    const t1 = new tokens.Token(0, 1, 'tag1', tokens.TokenType.TAG);
    const t2 = new tokens.Token(2, 3, 'tag2', tokens.TokenType.TAG);

    const startAST = new ast.Node(opTk, ops.Operators[">"]);
    startAST.addChild(new ast.Node(t1));
    startAST.addChild(new ast.Node(t2));

    const targetAST =  new ast.Node(opTk, ops.Operators[">"]);
    targetAST.addChild(new ast.Node(t1));
    targetAST.addChild(new ast.Node(t2));

    flattenPathing(startAST, null);
    assert.ok(ast.nodesEqual(startAST, targetAST));
  });

  it('should flatten a three tag path', function() {
    const op1 = new tokens.Token(1, 2, '>', tokens.TokenType.OPERATOR);
    const op2 = new tokens.Token(3, 4, '>', tokens.TokenType.OPERATOR)
    const t1 = new tokens.Token(0, 1, 'tag1', tokens.TokenType.TAG);
    const t2 = new tokens.Token(2, 3, 'tag2', tokens.TokenType.TAG);
    const t3 = new tokens.Token(5, 6, 'tag3', tokens.TokenType.TAG);
    const startAST = new ast.Node(op1, ops.Operators[">"]);
    startAST.addChild(new ast.Node(t1));
    const path2 = new ast.Node(op2, ops.Operators[">"]);
    path2.addChild(new ast.Node(t2));
    path2.addChild(new ast.Node(t3));
    startAST.addChild(path2);

    const targetAST = new ast.Node(op1, ops.Operators[">"]);
    targetAST.addChild(new ast.Node(t1));
    targetAST.addChild(new ast.Node(t2));
    targetAST.addChild(new ast.Node(t3));

    flattenPathing(startAST, null);
    assert.ok(ast.nodesEqual(startAST, targetAST));
  });
});

describe('parsing a path', function () {
  const tkSequence = [
    new tokens.Token(0, 1, 'not', tokens.TokenType.OPERATOR),
    new tokens.Token(2, 3, 'grandparent', tokens.TokenType.TAG),
    new tokens.Token(4, 5, '>', tokens.TokenType.OPERATOR),
    new tokens.Token(6, 7, 'parent', tokens.TokenType.TAG),
    new tokens.Token(8, 9, '>', tokens.TokenType.OPERATOR),
    new tokens.Token(10, 11, 'child', tokens.TokenType.TAG),
    new tokens.Token(12, 13, '*', tokens.TokenType.OPERATOR),
    new tokens.Token(12, 13, 'and', tokens.TokenType.OPERATOR),
    new tokens.Token(12, 13, 'tag2', tokens.TokenType.TAG),
  ];
  const parser = new btriev.Parser();

  const target = new ast.Node(tkSequence[7], ops.Operators.and);
  const negation = new ast.Node(tkSequence[0], ops.Operators.not);
  const path1 = new ast.Node(tkSequence[2], ops.Operators['>']);
  const explosion = new ast.Node(tkSequence[6], ops.Operators['*']);

  // note these should be flattened, even if initially parsed to binary ops
  path1.addChild(new ast.Node(tkSequence[1]));
  path1.addChild(new ast.Node(tkSequence[3]));
  path1.addChild(new ast.Node(tkSequence[5]));

  explosion.addChild(path1);
  negation.addChild(explosion);

  target.addChild(negation);
  target.addChild(new ast.Node(tkSequence[8]));

  it('should produce a depth 4 AST', function () {
    assert.ok(ast.nodesEqual(parser.parse(tkSequence), target, true));
  });
});

describe('nonexistent  tags', function () {
  const tkSequence = [
    new tokens.Token(0, 1, 'not a tag', tokens.TokenType.TAG),
    new tokens.Token(12, 13, 'and', tokens.TokenType.OPERATOR),
    new tokens.Token(14, 15, 'tag', tokens.TokenType.TAG),
  ];

  it('should throw when a hierarchy is supplied', function() {
    const hierarchy = btriev.TagHierarchy.createFromEdgeList([], tags=[{id: 1, name: 'tag'}]);
    const parser = new btriev.Parser(hierarchy);

    let exc;
    try {
      parser.parse(tkSequence)
    }
    catch(e) {
      exc = e;
    }

    assert.ok(exc);
    assert.strictEqual(exc.message, "Tag name 'not a tag' does not exist");
  });

  it('should succeed when a hierarchy is not supplied', function() {
    const parser = new btriev.Parser();
    const result = parser.parse(tkSequence);
    const target = new ast.Node(tkSequence[1], ops.Operators.and);
    target.addChild(new ast.Node(tkSequence[0]));
    target.addChild(new ast.Node(tkSequence[2]));

    assert.ok(ast.nodesEqual(result, target));
  });
});
