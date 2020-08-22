const {TokenType, Token} = require('./tokens');

//consume an entire quoted tag, if in the first position
const QUOTED_TAG_TOKEN = /^\s*("[^\\"]*(\\"[^\\"]*)*")/;
// consume the nearest operator, allowing unquoted tags before it
// note, for text operators, if present, only only space is consumed following the token
const CONSUME_TEXT_OPERATOR = /\b(AND|OR|NOT)(\s+|"|\(|\)|>|\*|$)/i;

// for symbol operators, we ignore all whitespace. note we ignore the " operator here, since a dedicated
// regex handles it
const CONSUME_SYMBOL_OPERATOR = /(\*|>|\(|\))/;

function tokenizeOperatorMatch(match, consumedIx, unconsumedQuery) {
  const operatorIndex = match['index'];
  const operator = match[1].toLowerCase();

  const tokens = [];

  // anything to the left of the operator is an unquoted tag
  const lhsWhitespace = unconsumedQuery.slice(consumedIx, operatorIndex + consumedIx);
  const lhsLeftClean = lhsWhitespace.trimLeft();
  const lhsClean = lhsLeftClean.trimRight();
  if (lhsClean) {
    tokens.push(new Token(
      consumedIx + (lhsWhitespace.length - lhsLeftClean.length),
      consumedIx + (lhsWhitespace.length - lhsLeftClean.length) + lhsClean.length - 1,
      lhsClean,
      TokenType.TAG)
    );
  }

  // we consumed everything before the operator, plus the operator length itself
  const newConsumedIx = consumedIx + operatorIndex + operator.length;

  tokens.push(new Token(
    consumedIx + operatorIndex,
    newConsumedIx - 1,
    operator,
    TokenType.OPERATOR));

  return {
    tokens,
    newConsumedIx,
  };
}

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
        const tokenQuotedLeftClean = quotedTagMatch[0].trimLeft();
        const tokenQuotedClean = tokenQuotedLeftClean.trimRight();
        const unescapedTokenContent = tokenQuotedClean.replace(/\\"/g, '"');
        const tokenValue = unescapedTokenContent.slice(1, unescapedTokenContent.length - 1);
        const token = new Token(consumedIx + (quotedTagMatch[0].length - tokenQuotedLeftClean.length),
          consumedIx + (quotedTagMatch[0].length - tokenQuotedLeftClean.length) + tokenQuotedClean.length - 1,
          tokenValue,
          TokenType.TAG);

        tokens.push(token);
        consumedIx = consumedIx + quotedTagMatch[0].length;

        continue;
      }

      // run both operator regexes, and see which form of operator happens first
      // these regexes could be combined, but the regex complexity explodes
      const symbolOperatorMatch = CONSUME_SYMBOL_OPERATOR.exec(unconsumedQuery);
      const textOperatorMatch = CONSUME_TEXT_OPERATOR.exec(unconsumedQuery);
      if ((textOperatorMatch && symbolOperatorMatch && textOperatorMatch['index'] < symbolOperatorMatch['index']) ||
        (textOperatorMatch && !symbolOperatorMatch)
      ) {
        const tokenization = tokenizeOperatorMatch(textOperatorMatch, consumedIx, query);
        tokenization.tokens.forEach(t => tokens.push(t));
        consumedIx = tokenization.newConsumedIx;
      }
      else if (symbolOperatorMatch) {
        const tokenization = tokenizeOperatorMatch(symbolOperatorMatch, consumedIx, query);
        tokenization.tokens.forEach(t => tokens.push(t));
        consumedIx = tokenization.newConsumedIx;
      }
      else {
        // if nothing else matched as an operator or quoted tag, all that remains is an unquoted tag
        const leftStripped = unconsumedQuery.trimLeft();
        const tagStripped = leftStripped.trimRight();
        const leftIx = consumedIx + (unconsumedQuery.length - leftStripped.length);
        if (tagStripped)  {
          tokens.push(new Token(
            leftIx,
            leftIx + tagStripped.length - 1,
            tagStripped,
            TokenType.TAG
          ));
        }
        consumedIx = query.length;
      }
    }

    return tokens;
  }
}

module.exports = {
  Lexer,
};