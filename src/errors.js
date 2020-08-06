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

class InvalidTagError extends ParseError {
  constructor(token) {
    const message = `Tag name '${token.getValue()}' does not exist`;
    super(message, token.getStartIndex(), token.getEndIndex());
  }
}

class InvalidPathError extends ParseError {
  constructor(token) {
    super(`Path does not exist`, token.getStartIndex(), token.getEndIndex());
  }

}

module.exports = {
  ParseError,
  InvalidTagError,
  InvalidPathError,
};