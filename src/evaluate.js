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

/**
 * a mutable holder for intermediate evaluation results
 * since we have operators on two different types, "results" may pertain to either tags or data
 * there is an order independence, since all tag evaluations must occur before data evaluations
 * once a data operation has been made (i.e. the EvaluationResult is asked for rows of data)
 * future requests for tag evaluation results will be met with an exception (which should only be developer facing, if
 * the AST was properly vetted)
 */
class EvaluationResult {

  constructor() {

  }

  getData() {

  }

  getTags() {

  }

}


function dfsEvaluate(ast, context) {
  const childEvaluations = ast.getChildren().forEach(n => {
    return dfsEvaluate(n, context);
  });

  const operator = ast.getOperator();
  if (operator) {
    operator.evaluate(context, childEvaluations);
  }
}