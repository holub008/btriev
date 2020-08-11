const lex = require('./lexer');
const parse = require('./parser');
const er = require('./evaluation_result');

/**
 * @param query a string btriev query
 * @param data an array of array of tag ids (Number)
 * @param tagHierarchy
 */
function evaluate(query, data, tagHierarchy) {
  const lexer = new lex.Lexer();
  const parser = new parse.Parser(tagHierarchy);
  const ast = parser.parse(lexer.tokenize(query));
  const context = new EvaluationContext(tagHierarchy, data);
  const result = dfsEvaluate(ast, context)

  return result.getDataIxs(context);
}

class EvaluationContext {
  #tagHierarchy;
  #allRows;
  #data;
  constructor(tagHierarchy, data) {
    this.#tagHierarchy = tagHierarchy;
    this.#data = data;
    this.#allRows = Array(data.length).fill().map((_, i) => i);
  }

  getTagHierarchy() {
    return this.#tagHierarchy
  }

  getData() {
    return this.#data;
  }

  getAllRows()  {
    return this.#allRows;
  }
}

function dfsEvaluate(ast, context) {
  const operator = ast.getOperator();
  if (operator) {
    const childEvaluations = ast.getChildren().map(n => {
      return dfsEvaluate(n, context);
    });
    operator.evaluate(context, childEvaluations);
  }
  else {
    // note, we assume that tags may only occur at the roots - i.e. we ignore children
    return er.EvaluationResult.fromTag(ast.getToken().getValue(), context.getTagHierarchy());
  }
}