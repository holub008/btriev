const lex = require('./lexer');
const parse = require('./parser');

/**
 * @param query a string btriev query
 * @param data an array of array of tag ids (Number)
 * @param tagHierarchy
 */
function evaluate(query, data, tagHierarchy) {
  const lexer = new lex.Lexer();
  const parser = new parse.Parser(tagHierarchy);

  const ast = parser.parse(lexer.tokenize(query));
}

class EvaluationContext {

  constructor(tagHierarchy, data) {
    this._tagHierarchy = tagHierarchy;

  }

  getTagHierarchy() {
    return this._tagHierarchy
  }

  getAllRows()  {
    return this._allRows;
  }
}

function dfsEvaluate(ast, context) {
  ast.getChildren().forEach(n => {
    const operator = n.getOperator();
    if (operator) {
      operator.evaluate(context, )
    }
  });
}