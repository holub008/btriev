const err = require('./errors');

class Node {

  constructor(token, operator=null) {
    this._children = [];
    this._token = token;
    this._operator = operator;
  }

  getToken() {
    return this._token;
  }

  getOperator() {
    return this._operator;
  }

  attachToAST(expressions) {
    /**
     * note, this method makes assumptions about how the token & expression stack is populated. it should be assumed "package private"\
     * `this` object is mutated, and expressions is mutated (this is done in place for performance reasons :|)
     */
    if (this._operator.getPlacement() === OperatorPlacement.INFIX) {
      // always pop from the back
      const rhs = expressions.pop();
      const lhs = expressions.pop();

      if (!rhs || !lhs) {
        throw new err.ParseError(`Binary operator ${this._operator.getDisplayName()} requires left and right expressions to operate on.`,
          this._token.getStartIndex(), this._token.getEndIndex());
      }

      this.addChild(lhs);
      this.addChild((rhs);
      expressions.push(this);
    }
    else if (this._operator.getPlacement() === OperatorPlacement.LEFT) {
      const rhs = expressions.pop();

      if (!rhs) {
        throw new err.ParseError(`Left unary operator ${this._operator.getDisplayName()} requires an expression to operate on`);
      }

      this.addChild(rhs);
      expressions.push(this);
    }
    else if (this._operator.getPlacement() === OperatorPlacement.RIGHT) {
      const lhs = expressions.pop();

      if (!lhs) {
        throw new err.ParseError(`Right unary operator ${this._operator.getDisplayName()} requires an expression to operate on`);
      }

      this.addChild(lhs);
      expressions.push(this);
    }
    else {
      throw new Error(`Unexpected operator placement attribute: ${this._operator.getPlacement()}`);
    }
  }

  addChild(node) {
    /*
        note, calls are order sensitive
     */
    this._children.push(node);
  }

  getChildren() {
    return this._children;
  }
}

const OperatorPlacement = {
  INFIX: 'infix',
  LEFT: 'left',
  RIGHT: 'right',
};

class Operator {
  constructor(placement, arity, precedence, displayName) {
    this._placement = placement;
    this._arity = arity;
    this._precedence = precedence;
    this._displayName = displayName;
  }

  getPlacement() {
    return this._placement;
  }

  getArity() {
    return this._arity;
  }

  getPrecedence() {
    return this._precedence;
  }

  getDisplayName() {
    return this._displayName;
  }
}

// note, this omits the quote operator, which is only meaningful for lexing
const Operators = {
  '(': new Operator(OperatorPlacement.LEFT, NaN, 6, 'open parenthesis'),
  ')': new Operator(OperatorPlacement.RIGHT, NaN, 6, 'close Parenthesis'),
  '>': new Operator(OperatorPlacement.INFIX, 2, 5, 'path operator'),
  '*': new Operator(OperatorPlacement.RIGHT, 1, 4, 'explode operator'),
  'not': new Operator(OperatorPlacement.LEFT, 1, 3, 'NOT'),
  'and': new Operator(OperatorPlacement.INFIX, 2, 2, 'AND'),
  'or': new Operator(OperatorPlacement.INFIX, 2, 1, 'OR'),
};

module.exports = {
  Node,
  Operator,
  Operators,
  OperatorPlacement,
};