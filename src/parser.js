const tokens = require('./tokens');
const ast = require('./ast');
const err = require('./errors');

function getIndexEdges(root) {
  const children = root.getChildren();

  if (children.length === 0) {
    return [root.getToken().getStartIndex(), root.getToken().getEndIndex()];
  }

  let rootedMin = Infinity;
  let rootedMax = -1;
  children.forEach(c => {
    const [cMin, cMax] = getIndexEdges(c);
    if (cMin < rootedMin) {
      rootedMin = cMin;
    }
    if (cMax > rootedMax) {
      rootedMax = cMax;
    }
  });

  return [rootedMin, rootedMax];
}

function shouldBackProcess(node, operatorStack) {
  if (operatorStack.length <= 0) {
    return false;
  }
  const topOperatorLiteral = operatorStack[operatorStack.length - 1].getOperator();
  const currentOperatorLiteral = node.getOperator();

  if (topOperatorLiteral === ast.Operators['(']) {
    return false;
  }

  return topOperatorLiteral.getPrecedence() >= currentOperatorLiteral.getPrecedence();
}

class Parser {

  processNext(operatorStack, expressions) {
    const operatorTag = operatorStack.pop();
    const operator = ast.Operators[operatorTag.getValue()];

    if (!operator) {
      // this is a developer error (ie bad lexing of the query), not a user facing one
      throw new Error(`Unrecognized operator type ${operatorTag.getValue()}`);
    }

    const expressionParent = new ast.Node(operatorTag);
    for (let opIx = 0; opIx < operator.getArity(); opIx++) {
      const childExpr = expressions.pop();
      if (!childExpr) {
        throw new err.ParseError('Missing expected expression', operatorTag.getStartIndex(), operatorTag.getEndIndex());
      }
      expressionParent.addChild(childExpr)
    }
    expressions.push(expressionParent);
  }

  parse(tokens) {
    let expressions = [];
    const operatorStack = [];

    tokens.forEach(t => {
      if (t.getType() === tokens.TokenType.TAG) {
        expressions.push(new ast.Node(t));
      }
      else if (t.getType() === tokens.TokenType.OPERATOR) {
        const operatorLiteral = ast.Operators[t.getValue()];

        if (!operatorLiteral) {
          throw new Error(`Unknown operator: ${t.getValue()}`);
        }
        const node = new ast.Node(t, operatorLiteral);

        if (operatorLiteral === ast.Operators["("]) {
          // this is a hardcode - assuming parens are highest prio
          operatorStack.push(node);
        }
        else if (operatorLiteral === ast.Operators[")"]) {
          // parse everything until the open parens
          let popped = operatorStack.pop();
          while (popped && popped.getOperator() !== ast.Operators['(']) {
            popped = operatorStack.pop();
            popped.attachToAST(expressions);
          }

          // case we ran through everything without finding the close parens - error location is the close paren
          if (!popped) {
            throw new err.ParseError(`Unmatched ${ast.Operators[')'].getDisplayName()}`,
              t.getStartIndex(), t.getEndIndex());
          }

          // pop off the open parens- its ordering is encoded in the AST and we are done with it
          operatorStack.pop();
        }
        else {
          while (shouldBackProcess(node, operatorStack)) {
            const priorNode = operatorStack.pop();
            priorNode.attachToAST(expressions);
          }
        }
      }
      else {
        // this is a developer error (adding a new, unhandled token type), not a user one
        throw new Error(`Unrecognized token type: ${t.getType()}`);
      }
    });

    // backprocess all remaining ops
    while (operatorStack.length > 0) {
      const currentNode = operatorStack.pop();
      currentNode.attachToAST(expressions);
    }

    //this condition indicates that two operands were abutted, with no operator between them
    if (expressions.length > 1 && operatorStack.length === 1) {
      const lhsEnd = getIndexEdges(expressions[0])[1];
      const rhsStart = getIndexEdges(expressions[1])[0];
      throw new err.ParseError('Expected an operator between expressions',
        lhsEnd, rhsStart);
    }

  }

}

module.exports = {
  Parser,
};