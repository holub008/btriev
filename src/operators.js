const er = require('./evaluation_result');

const OperatorPlacement = {
  INFIX: 'infix',
  LEFT: 'left',
  RIGHT: 'right',
};

class Operator {
  constructor(placement, arity, precedence, displayName, evaluateMethod) {
    this._placement = placement;
    this._arity = arity;
    this._precedence = precedence;
    this._displayName = displayName;
    this._evaluateMethod = evaluateMethod;
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

  evaluate(context, ...args) {
    const arity = this.getArity();
    if (!isNaN(arity) && args.length !== arity) {
      throw new Error(`Invalid call to operator ${this.getDisplayName()}: ${this.getArity()} args expected, ${args.length} supplied`);
    }

    return this._evaluateMethod(context, ...args);
  }
}

function notEvaluated() {
  throw new Error('This operator should not be evaluated!');
}

// note, this omits the quote operator, which is only meaningful for lexing
const Operators = {
  '(': new Operator(OperatorPlacement.LEFT, NaN, 6, 'open parenthesis', notEvaluated),
  ')': new Operator(OperatorPlacement.RIGHT, NaN, 6, 'close parenthesis', notEvaluated),
  '>': new Operator(OperatorPlacement.INFIX, 2, 5, 'path operator', path),
  '*': new Operator(OperatorPlacement.RIGHT, 1, 4, 'explode operator', explode),
  'not': new Operator(OperatorPlacement.LEFT, 1, 3, 'NOT', negateHandler),
  'and': new Operator(OperatorPlacement.INFIX, 2, 2, 'AND', intersectHandler),
  'or': new Operator(OperatorPlacement.INFIX, 2, 1, 'OR', unionHandler),
};

function path(context, ...operands) {
  const hierarchy = context.getTagHierarchy();
  const tagIds = hierarchy.getIdsForPath(operands.map(o => o.getTagIds()));

  return er.EvaluationResult.fromTagIds(tagIds);
}

function explode(context, ...operands) {
  const hierarchy = context.getTagHierarchy();
  const tagIds = hierarchy.explode(operands[0].getTagIds());

  return er.EvaluationResult.fromTagIds(tagIds);
}

function negateHandler(context, ...operands) {
  const all = context.getAllRows();
  const i = negate(all, operands[0].getDataIxs());
  return er.EvaluationResult.fromData(i);
}

function negate(all, data) {
  if (data.length === 0) {
    return all;
  }

  let dataIx = 0;
  let allIx = 0;
  let negation = [];
  while (dataIx <= data.length && allIx <= all.length) {
    if (data[dataIx] < all[allIx]) {
      dataIx++;
    }
    else if (data[dataIx] > all[allIx]) {
      negation.push(all[allIx]);
      allIx++;
    }
    else {
      dataIx++;
      allIx++;
    }
  }

  return negation;
}

function intersectHandler(context, ...operands) {
  const i = intersect(operands[0].getDataIxs(), operands[1].getDataIxs());
  return er.EvaluationResult.fromData(i);
}

function intersect(left, right) {
  if (left.length === 0 || right.length === 0) {
    return [];
  }

  let leftIx = 0;
  let rightIx = 0;
  let intersection = [];
  while (leftIx <= left.length && rightIx <= right.length) {
    if (left[leftIx] < right[rightIx]) {
      leftIx++;
    }
    else if (left[leftIx] > right[rightIx]) {
      rightIx++;
    }
    else {
      intersection.push(left[leftIx]);
      leftIx++;
      rightIx++;
    }
  }

  return intersection;
}

function unionHandler(context, ...operands) {
  const u = union(operands[0].getDataIxs(), operands[1].getDataIxs());
  return er.EvaluationResult.fromData(u);
}

function union(context, left, right) {
  if (left.length === 0 || right.length === 0) {
    return [];
  }

  let leftIx = 0;
  let rightIx = 0;
  let union = [];
  while (leftIx <= left.length && rightIx <= right.length) {
    if (left[leftIx] < right[rightIx]) {
      union.push(left[leftIx])
      leftIx++;
    }
    else if (left[leftIx] > right[rightIx]) {
      union.push(right[rightIx]);
      rightIx++;
    }
    else {
      union.push(left[leftIx]);
      leftIx++;
      rightIx++;
    }
  }

  if (leftIx < left.length) {
    union = union.concat(left.slice(leftIx, left.length));
  }
  else if (rightIx < right.length) {
    union = union.concat(right.slice(rightIx, right.length));
  }

  return union;
}

module.exports = {
  Operator,
  Operators,
  OperatorPlacement,
};