const tk = require('./tokens');
const ast = require('./ast');
const ops = require('./operators');
const err = require('./errors');

function shouldBackProcess(node, operatorStack) {
  if (operatorStack.length <= 0) {
    return false;
  }
  const topOperatorLiteral = operatorStack[operatorStack.length - 1].getOperator();
  const currentOperatorLiteral = node.getOperator();

  if (topOperatorLiteral === ops.Operators['(']) {
    return false;
  }

  return topOperatorLiteral.getPrecedence() > currentOperatorLiteral.getPrecedence();
}

/**
 * NOTE: this function validates that paths exist, after flattening them
 * @param node the Node root to start searching & flattening from
 * @param tagHierarchy a nullable TagHierarchy object for checking valid paths (not checked if null)
 * @param parent the parent Node of the start Node
 * @return should be ignored - modifies the AST in place
 */
function flattenPathing(node, tagHierarchy, parent=null) {
  const operator = node.getOperator();

  // case we have a tag, which will only occur on the leaf nodes
  if (!operator) {
    if (parent && parent.getOperator() === ops.Operators['>']) {
      return [node];
    }
    // else, whatever the child tags are, it's irrelevant
    return [];
  }
  else if (operator === ops.Operators['>']) {
    const childPath = flattenPathing(node.getChildren()[1], tagHierarchy, node);
    childPath.unshift(node.getChildren()[0]);
    // if the parent is no longer a path operator, it's time to stop flattening
    if (!parent || (parent && parent.getOperator() !== ops.Operators['>'])) {
      // if supplied, validate the pathing
      if (tagHierarchy) {
        const validPath = tagHierarchy.pathExists(childPath.map(n => n.getToken().getValue()));
        if (!validPath) {
          throw new err.InvalidPathError(node.getToken());
        }
      }
      node.setChildren(childPath);
      return [];
    }
    else {
      return childPath;
    }
  }
  else {
    // continue our traversal down, ignoring anything that gets returned
    // we can ignore because we know that path operators have already been verified to only be at the final branches (before tags) of the AST
    node.getChildren().forEach(n => flattenPathing(n, tagHierarchy, node));
    return [];
  }
}

function validateOperators(node) {
  const operator = node.getOperator();
  if (!operator) {
    if (node.getChildren().length > 0) {
      // this is a developer facing error only - the parser should never produce this structure
      throw new Error('Tag in AST should never have children');
    }
  }
  else {
    const arity = operator.getArity();
    if ( !isNaN(arity) && arity !== node.getChildren().length) {
      throw new err.ParseError(`${operator.getDisplayName()} expects ${arity} operands, but received ${node.getChildren().length}`,
        node.getToken().getStartIndex(), node.getToken().getEndIndex());
    }
    // TODO formalize the concept of "tag operators" vs "data operators"?
    if (operator === ops.Operators[">"] || operator === ops.Operators["*"]) {
      const childrenAreTags = node.getChildren().every(n => {
        const isTag = !n.getOperator();
        const isTagOperator = n.getOperator() === ops.Operators[">"] || n.getOperator() === ops.Operators["*"];
        return isTag || isTagOperator;
      });
      if (!childrenAreTags) {
        throw new err.ParseError(`${operator.getDisplayName()} expects only tag operands`,
          node.getToken().getStartIndex(), node.getToken().getEndIndex());
      }
    }

    node.getChildren().forEach(n => validateOperators(n));
  }
}

function validateAndRestructureAST(ast, tagHierarchy) {
  validateOperators(ast);
  // put all tags flat underneath the path operator & check that paths are valid
  flattenPathing(ast, tagHierarchy);
}

class Parser {
  /**
   * @param tagHierarchy when null, no tag name checking is done. when supplied, tag names are verified
   */
  constructor(tagHierarchy=null) {
    this._tagHierarchy = tagHierarchy;
  }

  parse(tokens) {
    let expressions = [];
    const operatorStack = [];

    let lastWasExpression = false;
    let currentControlDepth = 0;

    tokens.forEach(t => {
      if (t.getType() === tk.TokenType.TAG) {
        if (lastWasExpression) {
          throw new err.ParseError('Expected an operator before tag',
            t.getStartIndex(), t.getEndIndex());
        }

        if (this._tagHierarchy && !this._tagHierarchy.containsTag(t.getValue())) {
          throw new err.InvalidTagError(t);
        }

        const node = new ast.Node(t);
        node.setControlDepth(currentControlDepth);
        expressions.push(node);
        lastWasExpression = true;
      }
      else if (t.getType() === tk.TokenType.OPERATOR) {
        const operatorLiteral = ops.Operators[t.getValue()];

        if (!operatorLiteral) {
          throw new Error(`Unknown operator: ${t.getValue()}`);
        }
        const node = new ast.Node(t, operatorLiteral);
        node.setControlDepth(currentControlDepth);

        if (operatorLiteral === ops.Operators["("]) {
          operatorStack.push(node);

          currentControlDepth++;
          lastWasExpression = false;
        }
        else if (operatorLiteral === ops.Operators[')']) {
          // parse everything until the open parens
          let popped = operatorStack.pop();
          while (popped && popped.getOperator() !== ops.Operators['(']) {
            popped.attachToAST(expressions);
            popped = operatorStack.pop();
          }

          // case we ran through everything without finding the close parens - error location is the close paren
          if (!popped) {
            throw new err.ParseError(`Unmatched ${ops.Operators[')'].getDisplayName()}`,
              t.getStartIndex(), t.getEndIndex());
          }

          // since we've backed out of parens, reduce control depth
          currentControlDepth--;
          const mostRecentExpr = expressions[expressions.length - 1];
          mostRecentExpr.setControlDepth(currentControlDepth);

          // since trailing parens indicates an expression
          lastWasExpression = true;
        }
        else {
          while (shouldBackProcess(node, operatorStack)) {
            const priorNode = operatorStack.pop();
            priorNode.attachToAST(expressions);
          }
          operatorStack.push(node);

          lastWasExpression = false;
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
      if (currentNode.getOperator() === ops.Operators['(']) {
        throw new err.ParseError(`Unmatched ${ops.Operators['('].getDisplayName()}`,
          currentNode.getToken().getStartIndex(), currentNode.getToken().getEndIndex());
      }
      currentNode.attachToAST(expressions);
    }

    // this condition indicates that two operands were abutted, with no operator between them
    // I don't expect this to ever happen give the earlier checks for non-adjoined tags
    if (expressions.length > 1) {
      const lhsEnd = ast.getIndexEdges(expressions[0])[1] + 1;
      const rhsStart = ast.getIndexEdges(expressions[1])[0];
      throw new err.ParseError('Expected an operator between expressions',
        lhsEnd, rhsStart);
    }
    else if (expressions.length === 0) {
      return null;
    }
    else {
      validateAndRestructureAST(expressions[0])
      return expressions[0];
    }
  }
}

module.exports = {
  Parser,
};