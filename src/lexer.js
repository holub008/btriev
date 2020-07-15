
//consume an entire quoted tag
const QUOTED_TAG_TOKEN = /^"[^\\"]*(\\"[^\\"]*)*"/;
// consume unquoted tags and operators until a control operator (, ), or "
const UNTIL_CONTROL_OPERATOR =/^[^(\(\)")]+/i;

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
        let currentGlom;
        let ix = 0;
        do {

        }
        while(true)
    }
}

module.exports = {
    Lexer,
};