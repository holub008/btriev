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

module.exports = {
  ParseError,
};