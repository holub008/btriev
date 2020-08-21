const err = require('./errors');
const ops = require('./operators');

class Node {

  _children = []
  _token;
  _operator;
  _controlDepth;

  constructor(token, operator=null) {
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
    if (!this.getOperator()) {
      throw new Error('Attaching a non-operator to the AST is not allowed!');
    }

    if (this.getOperator().getPlacement() === ops.OperatorPlacement.INFIX) {
      // always pop from the back
      const rhs = expressions.pop();
      const lhs = expressions.pop();

      if (!rhs || !lhs || lhs.getControlDepth() !== rhs.getControlDepth() || lhs.getControlDepth() !== this.getControlDepth()) {
        throw new err.ParseError(`Binary ${this.getOperator().getDisplayName()} requires left and right expressions to operate on.`,
          this.getToken().getStartIndex(), this.getToken().getEndIndex());
      }

      // this is slow(er), but does give the user informative errors
      if (getIndexEdges(rhs)[0] < this.getToken().getStartIndex()) {
        throw new err.ParseError(`Binary ${this.getOperator().getDisplayName()} requires left and right expressions to operate on.`,
          this.getToken().getStartIndex(), this.getToken().getEndIndex());
      }

      this.addChild(lhs);
      this.addChild(rhs);
      expressions.push(this);
    }
    else if (this.getOperator().getPlacement() === ops.OperatorPlacement.LEFT) {
      const rhs = expressions.pop();

      if (!rhs || rhs.getControlDepth() !== this.getControlDepth()) {
        throw new err.ParseError(`Left unary ${this.getOperator().getDisplayName()} requires an expression to operate on`,
          this.getToken().getStartIndex(), this.getToken().getEndIndex());
      }

      if (getIndexEdges(rhs)[0] < this._token.getStartIndex()) {
        throw new err.ParseError(`Left unary ${this.getOperator().getDisplayName()} requires an expression to operate on.`,
          this.getToken().getStartIndex(), this.getToken().getEndIndex());
      }

      this.addChild(rhs);
      expressions.push(this);
    }
    else if (this.getOperator().getPlacement() === ops.OperatorPlacement.RIGHT) {
      const lhs = expressions.pop();

      if (!lhs || lhs.getControlDepth() !== this.getControlDepth()) {
        throw new err.ParseError(`Right unary ${this.getOperator().getDisplayName()} requires an expression to operate on`,
          this._token.getStartIndex(), this.getToken().getEndIndex());
      }

      this.addChild(lhs);
      expressions.push(this);
    }
    else {
      throw new Error(`Unexpected operator placement attribute: ${this.getOperator().getPlacement()}`);
    }
  }

  /**
   * add a child node, incrementally
   */
  addChild(node) {
    this._children.push(node);
  }

  /**
   * get the nodes children, in their current state
   */
  getChildren() {
    return this._children;
  }

  /**
   * set the node's children, completely overwriting prior children
   */
  setChildren(children) {
    this._children = children;
  }

  /**
   * do not use - this is considered an implementation detail of the Node class
   */
  setControlDepth(depth) {
    this._controlDepth = depth;
  }

  /**
   * do not use - this is considered an implementation detail of the Node class
   */
  getControlDepth() {
    return this._controlDepth;
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

function getIndexEdges(root) {
  const children = root.getChildren();

  if (!children || children.length === 0) {
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

module.exports = {
  Node,
  nodesEqual,
  getIndexEdges,
};