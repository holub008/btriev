const TokenType = {
  OPERATOR: 'operator',
  TAG: 'tag',
};

class Token {
  constructor(startIndex, endIndex, value, type) {
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    this.value = value;
    this.type = type;
  }

  getStartIndex() {
    return this.startIndex;
  }

  getEndIndex() {
    return this.endIndex;
  }

  getValue() {
    return this.value;
  }

  getType() {
    return this.type;
  }

  equals(other) {
    return other &&
      other instanceof Token &&
      other.getStartIndex() === this.getStartIndex() &&
      other.getEndIndex() === this.getEndIndex() &&
      other.getValue() === this.getValue() &&
      other.getType() === this.getType();
  }

  toString() {
    return JSON.stringify({
      startIndex: this.getStartIndex(),
      endIndex: this.getEndIndex(),
      value: this.getValue(),
      type: this.getType(),
    });
  }
}

function tokensEqual(left, right, verbose = true) {
  if (!left || !right) {
    throw new Error('Objects to compare must be non-null');
  }

  let equal = true;
  let leftString, rightString, unequalReason;

  if (left instanceof Token && right instanceof Token) {
    equal = left.equals(right);
    leftString = left.toString();
    rightString = right.toString();
    unequalReason = 'some token attributes differ';
  }
  else if (typeof left[Symbol.iterator] === 'function' && typeof right[Symbol.iterator] === 'function') {
    if (left.length !== right.length) {
      equal = false;
      unequalReason = `Lengths differ left = ${left.length}, right = ${right.length}`;
    }
    else {
      for (let ix = 0; ix < left.length; ix++) {
        if (!left[ix].equals(right[ix])) {
          equal = false;
          unequalReason = `Elements at index = ${ix} differ.`;
          break;
        }
      }
    }

    leftString = left
      .map(t => t.toString())
      .join(',\n');
    rightString = right
      .map(t => t.toString())
      .join(',\n');
  }
  else {
    throw new Error('Unknown operand types, must be Token or iterable types');
  }

  if (!equal && verbose) {
    console.log(`Left:\n${leftString}\n\nAnd right:\n${rightString}\n\nAre not equal: ${unequalReason}.`);
  }

  return equal;
}

module.exports = {
  Token,
  TokenType,
  tokensEqual,
};