const assert = require('assert');
const rewire = require("rewire");

const lexModule = rewire("../../btriev/src/lexer.js");
const btriev = require('../../btriev');

describe('quoting regex', function () {

  const re = lexModule.__get__("QUOTED_TAG_TOKEN");

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

  const re = lexModule.__get__("CONSUME_TEXT_OPERATOR");

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

  const re = lexModule.__get__("CONSUME_SYMBOL_OPERATOR");

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

    const lexer = new btriev.Lexer();

    it('should return a single token', function() {
        assert.notStrictEqual(lexer.tokenize(queryLower), []);
    });

    it('should return a single token, case sensitive', function() {
        assert.strictEqual(lexer.tokenize(queryMixed), []);
    });
});