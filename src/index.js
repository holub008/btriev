const lex = require('./lexer');
const parse = require('./parser');

module.exports = {
    Lexer: lex.Lexer,
    Parser: parse.Parser
};