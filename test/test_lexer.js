const assert = require('assert');
const rewire = require("rewire");

const lm = rewire("../../btriev/src/lexer.js");

const btriev = require('../../btriev');
const tokens = require('../../btriev/src/tokens');

describe('quoting regex', function () {

  const re = lm.__get__("QUOTED_TAG_TOKEN");

  it('should not match an empty string', function () {
    const query = '';
    assert.strictEqual(re.exec(query), null);
  });

  it('should match an empty string literal', function () {
    const query = '""';
    assert.strictEqual(re.exec(query)[1], '""');
  });

  it('should not match a non-leading string literal', function () {
    const query = 'and ""';
    assert.strictEqual(re.exec(query), null);
  });

  it('should match a whitespace padded string literal', function () {
    const query = '\n\t "blah"';
    const match = re.exec(query);
    assert.strictEqual(match[1], '"blah"');
  });

  it('should not match a trailing content', function () {
    const query = '"yes" or';
    assert.strictEqual(re.exec(query)[1], '"yes"');
  });

  it('should match mixed content', function () {
    const query = '"yes and \\"maybe\\" with weird " or';
    assert.strictEqual(re.exec(query)[1], '"yes and \\"maybe\\" with weird "');
  });
});

describe('text operator regex', function () {

  const re = lm.__get__("CONSUME_TEXT_OPERATOR");

  it('should not match an empty string', function () {
    const query = '';
    assert.strictEqual(re.exec(query), null);
  });

  it('should not match a full unquoted tag', function () {
    const query = 'tag name 1 with%! fun ch@ractersandsomenotorkeywords';
    assert.strictEqual(re.exec(query), null);
  });

  it('should match a starting operator', function () {
    const query = 'and and';
    const match = re.exec(query);
    assert.strictEqual(match[1], 'and');
    assert.strictEqual(match['index'], 0);
  });

  it('should match a trailing operator', function () {
    const query = 'tag and';
    const match = re.exec(query);
    assert.strictEqual(match[1], 'and');
    assert.strictEqual(match['index'], 4);
  });

  it('should match a not match an operator without whitespace', function () {
    const query1 = 'andand ';
    const query2 = '\n  land';
    assert.strictEqual(re.exec(query1), null);
    assert.strictEqual(re.exec(query2), null);
  });

  it('should match or', function () {
    const query1 = 'or ';
    const query2 = 'tag1    or "tag2"';
    const query3 = 'tag1    \nor (blah)';

    const match1 = re.exec(query1);
    const match2 = re.exec(query2);
    const match3 = re.exec(query3);

    assert.strictEqual(match1[1], 'or');
    assert.strictEqual(match1['index'], 0);
    assert.strictEqual(match2[1], 'or');
    assert.strictEqual(match2['index'], 8);
    assert.strictEqual(match3[1], 'or');
    assert.strictEqual(match3['index'], 9);
  });

  it('should match not', function () {
    const query1 = ' not tag';
    const query2 = ' blah not"tag"';
    const query3 = 'blah not(other or this)';

    const match1 = re.exec(query1);
    const match2 = re.exec(query2);
    const match3 = re.exec(query3);

    assert.strictEqual(match1[1], 'not');
    assert.strictEqual(match1['index'], 1);
    assert.strictEqual(match2[1], 'not');
    assert.strictEqual(match2['index'], 6);
    assert.strictEqual(match3[1], 'not');
    assert.strictEqual(match3['index'], 5);
  });

  it('should match case insensitive', function () {
    const query1 = ' Not tag';
    const query2 = 'tag1 AND"tag2';

    const match1 = re.exec(query1);
    const match2 = re.exec(query2);

    assert.strictEqual(match1[1], 'Not');
    assert.strictEqual(match1['index'], 1);
    assert.strictEqual(match2[1], 'AND');
    assert.strictEqual(match2['index'], 5);
  });
});

describe('symbol operator regex', function () {

  const re = lm.__get__("CONSUME_SYMBOL_OPERATOR");

  it('should not match an empty string', function () {
    const query = '';
    assert.strictEqual(re.exec(query), null);
  });

  it('should not match non-symbol-operators', function () {
    const query = 'and or not blah';
    assert.strictEqual(re.exec(query), null);
  });

  it('should match explosion', function () {
    const query1 = 'tag*';
    const query2 = '*';
    const match1 = re.exec(query1);
    const match2 = re.exec(query2);

    assert.strictEqual(match1[0], '*');
    assert.strictEqual(match1['index'], 3);

    assert.strictEqual(match2[0], '*');
    assert.strictEqual(match2['index'], 0);
  });

  it('should match pathing', function () {
    const query1 = '>';
    const query2 = 'tag1>tag2';
    const match1 = re.exec(query1);
    const match2 = re.exec(query2);

    assert.strictEqual(match1[0], '>');
    assert.strictEqual(match1['index'], 0);

    assert.strictEqual(match2[0], '>');
    assert.strictEqual(match2['index'], 4);
  });

  it('should match parens', function() {
    const query1 = '(';
    const query2 = ')';
    const query3 = 'not ()';
    const query4 = 'blah )';

    const match1 = re.exec(query1);
    const match2 = re.exec(query2);
    const match3 = re.exec(query3);
    const match4 = re.exec(query4);

    assert.strictEqual(match1[0], '(');
    assert.strictEqual(match1['index'], 0);

    assert.strictEqual(match2[0], ')');
    assert.strictEqual(match2['index'], 0);

    assert.strictEqual(match3[0], '(');
    assert.strictEqual(match3['index'], 4);

    assert.strictEqual(match4[0], ')');
    assert.strictEqual(match4['index'], 5);
  });
});

describe('empty query lexing', function() {
  const query = "";
  const query2 = " ";

  const lexer = new btriev.Lexer();

  it('should return an empty token list', function() {
    assert.notStrictEqual(lexer.tokenize(query), []);
  });

 it('should return an empty token list for whitespace', function() {
   assert.notStrictEqual(lexer.tokenize(query2), []);
 });
});


describe('lexing an unquoted tag', function() {
  const queryLower = "blah";
  const queryMixed = "Blah";
  const queryLeading = "Blah   ";
  const queryTrailing = "   Blah   ";

  const lexer = new btriev.Lexer();

  it('should return a single token', function() {
    const target = [new tokens.Token(0, 3, 'blah', tokens.TokenType.TAG)];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryLower), target));
  });

  it('should return a single token, case sensitive', function() {
    const target = [new tokens.Token(0, 3, 'Blah', tokens.TokenType.TAG)];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryMixed), target));
  });

  it('should return a single token, with correct leading indices', function() {
    const target = [new tokens.Token(0, 3, 'Blah', tokens.TokenType.TAG)];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryLeading), target));
  });

  it('should return a single token, with correct trailing indices', function() {
    const target = [new tokens.Token(3, 6, 'Blah', tokens.TokenType.TAG)];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryTrailing), target));
  });
});

describe('lexing a quoted tag', function() {
  const queryLower = '"blah blah"';
  const queryMixed = '"Blah and \\"blah\\""';
  const queryTrailing = '"Blah"  ';
  const queryLeading = '  "Blah"';


  const lexer = new btriev.Lexer();

  it('should handle simple text', function() {
    const target = [new tokens.Token(0, 10, 'blah blah', tokens.TokenType.TAG)];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryLower), target));
  });

  it('should handle escaped text', function() {
    const target = [new tokens.Token(0, 18, 'Blah and "blah"', tokens.TokenType.TAG)];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryMixed), target));
  });

  it('should handle trailing whitespace', function() {
    const target = [new tokens.Token(0, 5, 'Blah', tokens.TokenType.TAG)];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryTrailing), target));
  });

  it('should handle leading whitespace', function() {
    const target = [new tokens.Token(2, 7, 'Blah', tokens.TokenType.TAG)];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryLeading), target));
  });
});

describe('lexing a two part conjunction', function() {
  const queryUnquoted = "tag name 1 AND tag name 2";
  const queryQuoted = 'tag name 1 AND "tag name 2"';
  const lexer = new btriev.Lexer();

  it('should handle unquoted tags', function() {
    const target = [
      new tokens.Token(0, 9, 'tag name 1', tokens.TokenType.TAG),
      new tokens.Token(11, 13, 'and', tokens.TokenType.OPERATOR),
      new tokens.Token(15, 24, 'tag name 2', tokens.TokenType.TAG),
    ];

    assert.ok(tokens.tokensEqual(lexer.tokenize(queryUnquoted), target));
  });

  it('should handle quoted tags', function() {
    const target = [
      new tokens.Token(0, 9, 'tag name 1', tokens.TokenType.TAG),
      new tokens.Token(11, 13, 'and', tokens.TokenType.OPERATOR),
      new tokens.Token(15, 26, 'tag name 2', tokens.TokenType.TAG),
    ];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryQuoted), target));
  });
});

describe('lexing a two part union', function() {
  const queryUnquoted = "tag name 1 or tag name 2";
  // this is intentionally invalid syntax
  const queryQuoted = '"tag name" 1 OR "tag name 2"';
  const lexer = new btriev.Lexer();

  it('should handle unquoted tags', function() {
    const target = [
      new tokens.Token(0, 9, 'tag name 1', tokens.TokenType.TAG),
      new tokens.Token(11, 12, 'or', tokens.TokenType.OPERATOR),
      new tokens.Token(14, 23, 'tag name 2', tokens.TokenType.TAG),
    ];

    assert.ok(tokens.tokensEqual(lexer.tokenize(queryUnquoted), target));
  });

  it('should handle quoted tags', function() {
    const target = [
      new tokens.Token(0, 9, 'tag name', tokens.TokenType.TAG),
      new tokens.Token(11, 11, '1', tokens.TokenType.TAG),
      new tokens.Token(13, 14, 'or', tokens.TokenType.OPERATOR),
      new tokens.Token(16, 27, 'tag name 2', tokens.TokenType.TAG),
    ];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryQuoted), target));
  });
});

describe('lexing a negation', function() {
  const queryUnquoted = "not tag name 1";
  const queryQuoted = 'a tag\nnot "tag name"';
  const lexer = new btriev.Lexer();

  it('should handle a single unquoted tag', function() {
    const target = [
      new tokens.Token(0, 2, 'not', tokens.TokenType.OPERATOR),
      new tokens.Token(4, 13, 'tag name 1', tokens.TokenType.TAG),
    ];

    assert.ok(tokens.tokensEqual(lexer.tokenize(queryUnquoted), target));
  });

  it('should handle in context', function() {
    const target = [
      new tokens.Token(0, 4, 'a tag', tokens.TokenType.TAG),
      new tokens.Token(6, 8, 'not', tokens.TokenType.OPERATOR),
      new tokens.Token(10, 19, 'tag name', tokens.TokenType.TAG),
    ];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryQuoted), target));
  });
});

describe('path operator', function() {
  // intentionally invalid syntax
  const queryUnquoted = "x>y >tag name >>";
  const queryQuoted = '>"x">\n"tag name"';
  const lexer = new btriev.Lexer();

  it('should handle unquoted tags', function() {
    const target = [
      new tokens.Token(0, 0, 'x', tokens.TokenType.TAG),
      new tokens.Token(1, 1, '>', tokens.TokenType.OPERATOR),
      new tokens.Token(2, 2, 'y', tokens.TokenType.TAG),
      new tokens.Token(4, 4, '>', tokens.TokenType.OPERATOR),
      new tokens.Token(5, 12, 'tag name', tokens.TokenType.TAG),
      new tokens.Token(14, 14, '>', tokens.TokenType.OPERATOR),
      new tokens.Token(15, 15, '>', tokens.TokenType.OPERATOR),
    ];

    assert.ok(tokens.tokensEqual(lexer.tokenize(queryUnquoted), target));
  });

  it('should handle quoted tags', function() {
    const target = [
      new tokens.Token(0, 0, '>', tokens.TokenType.OPERATOR),
      new tokens.Token(1, 3, 'x', tokens.TokenType.TAG),
      new tokens.Token(4, 4,'>', tokens.TokenType.OPERATOR),
      new tokens.Token(6, 15, 'tag name', tokens.TokenType.TAG),
    ];
    assert.ok(tokens.tokensEqual(lexer.tokenize(queryQuoted), target));
  });
});

describe('lexing explode operator', function() {
  const query = '"x" * y';
  const lexer = new btriev.Lexer();

  it('should work in context', function() {
    const target = [
      new tokens.Token(0, 2, 'x', tokens.TokenType.TAG),
      new tokens.Token(4, 4, '*', tokens.TokenType.OPERATOR),
      new tokens.Token(6, 6,'y', tokens.TokenType.TAG),
    ];
    assert.ok(tokens.tokensEqual(lexer.tokenize(query), target));
  });
});


describe('lexing parens', function() {
  const query = '("x" and "y"  ) or( \n "tag1" \n )';
  const lexer = new btriev.Lexer();

  it('should work in context', function() {
    const target = [
      new tokens.Token(0, 0, '(', tokens.TokenType.OPERATOR),
      new tokens.Token(1, 3, 'x', tokens.TokenType.TAG),
      new tokens.Token(5, 7, 'and', tokens.TokenType.OPERATOR),
      new tokens.Token(9, 11,'y', tokens.TokenType.TAG),
      new tokens.Token(14, 14, ')', tokens.TokenType.OPERATOR),
      new tokens.Token(16, 17, 'or', tokens.TokenType.OPERATOR),
      new tokens.Token(18, 18, '(', tokens.TokenType.OPERATOR),
      new tokens.Token(22, 27, 'tag1', tokens.TokenType.TAG),
      new tokens.Token(31, 31, ')', tokens.TokenType.OPERATOR),

    ];
    assert.ok(tokens.tokensEqual(lexer.tokenize(query), target));
  });
});

describe('lexing a full query', function() {
  const query1 = 'not("x" and ("y and/or \\"z\\"" or z)) or \n ("grand tag">parent tag >  child tag \n and explodable*)';
  const lexer = new btriev.Lexer();

  it('should work...', function() {
    const target = [
      new tokens.Token(0, 2, 'not', tokens.TokenType.OPERATOR),
      new tokens.Token(3, 3, '(', tokens.TokenType.OPERATOR),
      new tokens.Token(4, 6, 'x', tokens.TokenType.TAG),
      new tokens.Token(8, 10, 'and', tokens.TokenType.OPERATOR),
      new tokens.Token(12, 12,'(', tokens.TokenType.OPERATOR),
      new tokens.Token(13, 28, 'y and/or "z"', tokens.TokenType.TAG),
      new tokens.Token(30, 31, 'or', tokens.TokenType.OPERATOR),
      new tokens.Token(33, 33, 'z', tokens.TokenType.TAG),
      new tokens.Token(34, 34, ')', tokens.TokenType.OPERATOR),
      new tokens.Token(35, 35, ')', tokens.TokenType.OPERATOR),
      new tokens.Token(37, 38, 'or', tokens.TokenType.OPERATOR),
      new tokens.Token(42, 42, '(', tokens.TokenType.OPERATOR),
      new tokens.Token(43, 53, 'grand tag', tokens.TokenType.TAG),
      new tokens.Token(54, 54, '>', tokens.TokenType.OPERATOR),
      new tokens.Token(55, 64, 'parent tag', tokens.TokenType.TAG),
      new tokens.Token(66, 66, '>', tokens.TokenType.OPERATOR),
      new tokens.Token(69, 77, 'child tag', tokens.TokenType.TAG),
      new tokens.Token(81, 83, 'and', tokens.TokenType.OPERATOR),
      new tokens.Token(85, 94, 'explodable', tokens.TokenType.TAG),
      new tokens.Token(95, 95, '*', tokens.TokenType.OPERATOR),
      new tokens.Token(96, 96, ')', tokens.TokenType.OPERATOR),
    ];
    assert.ok(tokens.tokensEqual(lexer.tokenize(query1), target));
  });
});
