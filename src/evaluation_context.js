class EvaluationContext {
  _tagHierarchy;
  _data;

  constructor(tagHierarchy, data) {
    this._tagHierarchy = tagHierarchy;
    this._data = data;
  }

  getTagHierarchy() {
    return this._tagHierarchy
  }

  getDataStore() {
    return this._data;
  }
}

module.exports = {
  EvaluationContext,
};