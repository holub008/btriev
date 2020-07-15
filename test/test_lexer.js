const assert = require('assert');
const rewire = require("rewire");

const lexModule = rewire("../../btriev/src/lexer.js");
const btriev = require('../../btriev');

describe('quoting regex', function() {

    const re = lexModule.__get__("QUOTED_TAG_TOKEN");

    it('should not match an empty string', function() {
        const query = '';
        assert.strictEqual(re.exec(query), null);
    });

    it('should match an empty string literal', function() {
        const query = '""';
        assert.strictEqual(re.exec(query)[0], '""');
    });

    it('should not match a non-leading string literal', function() {
        const query = 'and ""';
        assert.strictEqual(re.exec(query), null);
    });

    it('should not match a trailing content', function() {
        const query = '"yes" or';
        assert.strictEqual(re.exec(query)[0], '"yes"');
    });

    it('should match mixed content', function() {
        const query = '"yes and \\"maybe\\" with weird " or';
        assert.strictEqual(re.exec(query)[0], '"yes and \\"maybe\\" with weird "');
    });
});

describe('unquoted tag regex', function() {

    const re = lexModule.__get__("UNTIL_CONTROL_OPERATOR");

    it('should not match an empty string', function() {
        const query = '';
        assert.strictEqual(re.exec(query), null);
    });

    it('should consume a full, uncontrolled query', function() {
        const query = 'tag name 1 and tag2 or not tag3';
        assert.strictEqual(re.exec(query)[0], 'tag name 1 and tag2 or not tag3');
    });

    it('should not match starting from a control point', function() {
        const query = '""';
        assert.strictEqual(re.exec(query), null);
    });

    it('should consume until a control parens', function() {
        const query = 'tag1 and tag2 or tag3 and (tag2 and tag4)';
        assert.strictEqual(re.exec(query)[0], 'tag1 and tag2 or tag3 and ');
    });

    it('should consume until a control parens followed by quote', function() {
        const query = 'tag1 and tag2 or tag3 and  ("tag2" and tag4)';
        assert.strictEqual(re.exec(query)[0], 'tag1 and tag2 or tag3 and  ');
    });

    it('should consume until a quote', function() {
        const query = 'tag1 and "tag4"';
        assert.strictEqual(re.exec(query)[0], 'tag1 and ');
    });
});

/**
describe('tokenize on empty query', function() {
    const query = "";

    const lexer = btriev.Lexer();

    it('should return an empty token list', function() {
        assert.strictEqual(lexer.tokenize(query), []);
    });
});


describe('tokenize on a single tag query', function() {
    const queryLower = "blah";
    const queryMixed = "Blah";

    const lexer = btriev.Lexer();

    it('should return a single token', function() {
        assert.strictEqual(lexer.tokenize(query), []);
    });

    it('should return a single token, case sensitive', function() {
        assert.strictEqual(lexer.tokenize(query), []);
    });
});
 */