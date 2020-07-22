

class Node {

  constructor(token) {
    this._children = [];
    this._token = token;
  }

  getToken() {
    return this._token;
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
  constructor(placement, arity, precedence) {
    this._placement = placement;
    this._arity = arity;
    this._precedence = precedence;
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
}

// note, this omits the quote operator, which is only meaningful for lexing
const OperatorTypes = {
  '(': new Operator(OperatorPlacement.LEFT, NaN, 6),
  ')': new Operator(OperatorPlacement.RIGHT, NaN, 6),
  '>': new Operator(OperatorPlacement.RIGHT, 1, 5),
  '*': new Operator(OperatorPlacement.RIGHT, 1, 4),
  'not': new Operator(OperatorPlacement.LEFT, 1, 3),
  'and': new Operator(OperatorPlacement.INFIX, 2, 2),
  'or': new Operator(OperatorPlacement.INFIX, 2, 1),
};

module.exports = {
  Node,
  Operator,
  OperatorTypes,
  OperatorPlacement,
};