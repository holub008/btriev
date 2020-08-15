const lex = require('./lexer');
const parse = require('./parser');
const er = require('./evaluation_result');
const ec = require('./evaluation_context');

/**
 * @param query a string btriev query
 * @param data an array of array of tag ids (Number)
 * @param tagHierarchy
 */
function evaluate(query, data, tagHierarchy) {
  const lexer = new lex.Lexer();
  const parser = new parse.Parser(tagHierarchy);
  const ast = parser.parse(lexer.tokenize(query));
  // null ast indicates there's no query == no results
  if (!ast) {
    return [];
  }
  const context = new ec.EvaluationContext(tagHierarchy, data);
  const result = dfsEvaluate(ast, context)

  return result.getDataIds(context);
}

function dfsEvaluate(ast, context) {
  const operator = ast.getOperator();
  if (operator) {
    const childEvaluations = ast.getChildren().map(n => {
      return dfsEvaluate(n, context);
    });
    return operator.evaluate(context, childEvaluations);
  }
  else {
    // note, we assume that tags may only occur at the roots - i.e. we ignore children
    return er.EvaluationResult.fromTag(ast.getToken().getValue(), context.getTagHierarchy());
  }
}

module.exports = {
  evaluate,
};