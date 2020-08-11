class EvaluationContext {
  #tagHierarchy;
  #allRows;
  #data;
  constructor(tagHierarchy, data) {
    this.#tagHierarchy = tagHierarchy;
    this.#data = data;
    this.#allRows =
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