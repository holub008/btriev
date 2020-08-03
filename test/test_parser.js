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

  it('should produce a single root', function () {

    assert.ok(ast.nodesEqual(parser.parse(tkSequence), new ast.Node(tkSequence[1]), true));
  });
});
