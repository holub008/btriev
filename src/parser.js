const tokens = require('./tokens');
const ast = require('./ast');

class ParseError extends Error {
  constructor(message, startIndex, endIndex) {
    super();
    this.message = message;
    this.stack = (new Error()).stack;
    this.name = this.constructor.name;

    this._startIndex = startIndex;
    this._endIndex = endIndex;
  }

  getLocation() {
    return [this._startIndex, this._endIndex];
  }
}

function getIndexEdges(tree) {
  // perform a traversal to find the min & max query indices of the tokens
}

class Parser {

  processNext(operatorStack, expressions) {
    const operatorTag = operatorStack.pop();
    const operatorType = ast.OperatorTypes[operatorTag.getValue()]

    if (!operatorType) {
      throw new Error(`Unrecognized operator type ${operatorTag.getValue()}`);
    }

    const expressionParent = new ast.Node(operatorTag);
    for (let opIx = 0; opIx < operatorType.getArity(); opIx++) {
      const childExpr = expressions.pop();
      if (!childExpr) {
        throw new ParseError('Missing expected expression', operatorTag.getStartIndex(), operatorTag.getEndIndex());
      }
      expressionParent.addChild(childExpr)
    }
    expressions.push(expressionParent);

  }

  parse(tokens) {
    const expressions = [];
    const operatorStack = [];

    tokens.forEach(t => {
      if (t.getType() === tokens.TokenType.TAG) {
        expressions.push(new ast.Node(t));
      }
      else if (t.getType() === tokens.TokenType.OPERATOR) {
        if (t.getValue() === '(') {
          operatorStack.push(t);
        }
        else if (t.getValue() === ')') {
          // parse everything until the open parens
          let poppedOperator = operatorStack.pop();
          while (poppedOperator && poppedOperator.getValue() !== '(') {
            this.processNext();

            const operatorNode = new ast.Node(poppedOperator);

            poppedOperator = operatorStack.pop();
          }

          // case we ran through everything without finding the close parens
          if (!poppedOperator) {
            throw new ParseError('Unmatched parenthesis', t.getStartIndex(), t.getEndIndex());
          }

          // pop off the open parens- its ordering is encoded in the AST and we are done with it
          operatorStack.pop();
        }
        else {
          const operatorLiteral = ast.OperatorTypes[t.getValue()];
        }
      }
      else {
        throw new Error(`Unrecognized tag type: ${t.getType()}`)
      }

      //this condition indicates that two operands were abutted, with no operator between them
      if (expressions.length > 1 && operatorStack.length === 1) {
        const lhsEnd = getIndexEdges(expressions[0])[1];
        const rhsStart = getIndexEdges(expressions[1])[0];
        throw new ParseError('Expected an operator between expressions',
          lhsEnd, rhsStart);
      }
    });
  }

}

module.exports = {
  Parser,
};