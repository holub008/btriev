const assert = require('assert');

const btriev = require('../../btriev');
const tokens = require('../../btriev/src/tokens');
const ast = require('../../btriev/src/ast');


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
    const target = new ast.Node(tkSequence[1], ast.Operators.and);
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
    const target = new ast.Node(tkSequence[1], ast.Operators.or);
    const targetAnd = new ast.Node(tkSequence[3], ast.Operators.and);
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
    const target = new ast.Node(tkSequence[3], ast.Operators.or);
    const targetAnd = new ast.Node(tkSequence[1], ast.Operators.and);
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

  const target = new ast.Node(tkSequence[1], ast.Operators.and);
  const targetOr = new ast.Node(tkSequence[4], ast.Operators.or);
  targetOr.addChild(new ast.Node(tkSequence[3]));
  targetOr.addChild(new ast.Node(tkSequence[5]));

  target.addChild(new ast.Node(tkSequence[0]));
  target.addChild(targetOr);

  it('should produce a depth 2 AST, even with parens', function () {
    const tkSequenceWithParens = tkSequence.slice();
    assert.ok(ast.nodesEqual(parser.parse(tkSequenceWithParens), target, true));
  });
});