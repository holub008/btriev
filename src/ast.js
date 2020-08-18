const err = require('./errors');
const ops = require('./operators');

class Node {

  #children = []
  #token;
  #operator;
  #controlDepth;

  constructor(token, operator=null) {
    this.#token = token;
    this.#operator = operator;
  }

  getToken() {
    return this.#token;
  }

  getOperator() {
    return this.#operator;
  }

  attachToAST(expressions) {
    /**
     * note, this method makes assumptions about how the token & expression stack is populated. it should be assumed "package private"\
     * `this` object is mutated, and expressions is mutated (this is done in place for performance reasons :|)
     */
    if (!this.#operator) {
      throw new Error('Attaching a non-operator to the AST is not allowed!');
    }

    if (this.#operator.getPlacement() === ops.OperatorPlacement.INFIX) {
      // always pop from the back
      const rhs = expressions.pop();
      const lhs = expressions.pop();

      if (!rhs || !lhs || lhs.getControlDepth() !== rhs.getControlDepth() || lhs.getControlDepth() !== this.getControlDepth()) {
        throw new err.ParseError(`Binary ${this.#operator.getDisplayName()} requires left and right expressions to operate on.`,
          this.#token.getStartIndex(), this.#token.getEndIndex());
      }

      this.addChild(lhs);
      this.addChild(rhs);
      expressions.push(this);
    }
    else if (this.#operator.getPlacement() === ops.OperatorPlacement.LEFT) {
      const rhs = expressions.pop();

      if (!rhs || rhs.getControlDepth() !== this.getControlDepth()) {
        throw new err.ParseError(`Left unary ${this.#operator.getDisplayName()} requires an expression to operate on`,
          this.#token.getStartIndex(), this.#token.getEndIndex());
      }

      this.addChild(rhs);
      expressions.push(this);
    }
    else if (this.#operator.getPlacement() === ops.OperatorPlacement.RIGHT) {
      const lhs = expressions.pop();

      if (!lhs || lhs.getControlDepth() !== this.getControlDepth()) {
        throw new err.ParseError(`Right unary ${this.#operator.getDisplayName()} requires an expression to operate on`,
          this.#token.getStartIndex(), this.#token.getEndIndex());
      }

      this.addChild(lhs);
      expressions.push(this);
    }
    else {
      throw new Error(`Unexpected operator placement attribute: ${this.#operator.getPlacement()}`);
    }
  }

  /**
   * add a child node, incrementally
   */
  addChild(node) {
    this.#children.push(node);
  }

  /**
   * get the nodes children, in their current state
   */
  getChildren() {
    return this.#children;
  }

  /**
   * set the node's children, completely overwriting prior children
   */
  setChildren(children) {
    this.#children = children;
  }

  /**
   * do not use - this is considered an implementation detail of the Node class
   */
  setControlDepth(depth) {
    this.#controlDepth = depth;
  }

  /**
   * do not use - this is considered an implementation detail of the Node class
   */
  getControlDepth() {
    return this.#controlDepth;
  }

  equals(other) {
    /**
     * note: this is not a "deep" implementation - in that it does not check child nodes
     */
    const tokenEqual = this.getToken().equals(other.getToken());
    const operatorEqual = this.getOperator() === other.getOperator();

    return tokenEqual && operatorEqual;
  }

  toString(recursive=false) {
    return JSON.stringify({
      token: this.getToken(),
      operator: this.getOperator()?.getDisplayName(),
      children: recursive ? this.getChildren().map(c => c.toString(recursive)) : this.getChildren().length,
    });
  }
}

function nodesEqual(left, right, verbose, depth=0) {
  if (!left || !right) {
    throw new Error('Objects to compare must be non-null');
  }

  if (left instanceof Node && right instanceof Node) {

    if (!left.equals(right)) {
      if (verbose) {
        console.log(`Left:\n${left.toString()}\n\nAnd right:\n${right.toString()}\n\nAt depth = ${depth} have unequal attributes.`);
      }
      return false;
    }
    else {
      const leftChildren = left.getChildren();
      const rightChildren = right.getChildren();
      if (leftChildren.length !== rightChildren.length) {
        if (verbose) {
          console.log(`Left:\n${left.toString()}\n\nAnd right:\n${right.toString()}\n\nAt depth = ${depth} have unequal number of children.`);
        }
        return false;
      }
      else {
        for (let ix = 0; ix < left.getChildren().length; ix++) {
          const deepEquals = nodesEqual(leftChildren[ix], rightChildren[ix], verbose,depth + 1);
          // unequal children handle their own printing and the like
          // we also stop recursing on the first failure only
          if (!deepEquals){
            return false;
          }
        }
        return true;
      }

    }
  }
  else {
    throw new Error('Unknown operand types, must be Node type');
  }
}


module.exports = {
  Node,
  nodesEqual,
};