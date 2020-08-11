class EvaluationContext {
  #tagHierarchy;
  #data;

  constructor(tagHierarchy, data) {
    this.#tagHierarchy = tagHierarchy;
    this.#data = data;
  }

  getTagHierarchy() {
    return this.#tagHierarchy
  }

  getDataStore() {
    return this.#data;
  }
}

module.exports = {
  EvaluationContext,
};