const {TokenType, Token} = require('./tokens');

//consume an entire quoted tag, if in the first position
const QUOTED_TAG_TOKEN = /^\s*("[^\\"]*(\\"[^\\"]*)*")/;
// consume the nearest operator, allowing unquoted tags before it
// note, for text operators, if present, only only space is consumed following the token
const CONSUME_TEXT_OPERATOR = /\b(AND|OR|NOT)(\s+|"|\(|\)|>|\*|$)/i;

// for symbol operators, we ignore all whitespace. note we ignore the " operator here, since a dedicated
// regex handles it
const CONSUME_SYMBOL_OPERATOR = /\*|>|\(|\)/;

class Lexer {
  /**
   * the Lexer takes an input string (the raw query) and tokenizes it
   */
  constructor() {

  }

  /**
   * @param query a string query
   */
  tokenize(query) {
    // iterate through the query, left to right
    // we bite off chunks of either quotations (indicating a tag name), which may be escaped
    // or unquoted strings (whitespace separated), which may be either be tag names or operators
    // for unquoted strings, we glom together words until an operator is encountered
    const tokens = [];
    let consumedIx = 0;
    while (consumedIx < query.length) {
      const unconsumedQuery = query.slice(consumedIx);

      const quotedTagMatch = QUOTED_TAG_TOKEN.exec(unconsumedQuery);
      if (quotedTagMatch) {
        const consumedEndIndex = consumedIx + quotedTagMatch[0].length;
        const tokenValue = quotedTagMatch[1].trim();
        const token = new Token(consumedIx,
          consumedEndIndex,
          tokenValue,
          TokenType.TAG);

        tokens.push(token);
        consumedIx = consumedEndIndex;

        continue;
      }

      const symbolOperatorMatch = QUOTED_TAG_TOKEN.exec(unconsumedQuery);
      if (symbolOperatorMatch) {

      }

      const textOperatorMatch = CONSUME_SYMBOL_OPERATOR.exec(unconsumedQuery);
      if (textOperatorMatch) {
        const operatorIndex = textOperatorMatch['index'];

        // anything to the left of the operator is an unquoted tag
        if (operatorIndex > 0) {
          const lhs = query.slice(consumedIx, operatorIndex).trim()
        }
      }
    }
  }
}

module.exports = {
  Lexer,
};