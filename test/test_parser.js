const assert = require('assert');

const btriev = require('../../btriev');
const tokens = require('../../btriev/src/tokens');
const ast = require('../../btriev/src/ast');
const ops = require('../../btriev/src/operators');


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
  const path2 = new ast.Node(tkSequence[4], ops.Operators['>']);
  const explosion = new ast.Node(tkSequence[6], ops.Operators['*']);

  path2.addChild(new ast.Node(tkSequence[3]));
  path2.addChild(new ast.Node(tkSequence[5]));

  path1.addChild(new ast.Node(tkSequence[1]));
  path1.addChild(path2);

  explosion.addChild(path1);
  negation.addChild(explosion);

  target.addChild(negation);
  target.addChild(new ast.Node(tkSequence[8]));

  it('should produce a depth 4 AST', function () {
    assert.ok(ast.nodesEqual(parser.parse(tkSequence), target, true));
  });
});

// TODO tests for invalid syntax