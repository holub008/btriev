/**
 * a mutable holder for intermediate evaluation results
 * since we have operators on two different types, "results" may pertain to either tags or data
 * there is an order independence, since all tag evaluations must occur before data evaluations
 * once a data operation has been made (i.e. the EvaluationResult is asked for rows of data)
 * future requests for tag evaluation results will be met with an exception (which should only be developer facing, if
 * the AST was properly vetted)
 */
class EvaluationResult {

  static fromTag(tagName, hierarchy) {
    return new EvaluationResult(undefined, hierarchy.getIndices(tagName));
  }

  static fromData(dataIxs) {
    return new EvaluationResult(dataIxs);
  }

  static fromTagIxs(tagIxs) {
    return new EvaluationResult(undefined, tagIxs);
  }

  #dataIxs;
  #tagIxs;

  constructor(dataIxs, tagIxs) {
    if (!dataIxs && !tagIxs) {
      throw new Error('Cannot construct an evaluation result without either tags or data');
    }

    if (dataIxs && tagIxs) {
      throw new Error('Cannot construct an evaluation result with both tags and data');
    }

    this.#dataIxs = dataIxs;
    this.#tagIxs = tagIxs;
  }

  /**
   * for data operations, return the index result
   * for tag operations, lazily evaluate which data pertain to the previously specified tag(s)
   * @param context an EvaluationContext object
   */
  getDataIxs(context) {
    if (this.#dataIxs) {
      return this.#dataIxs;
    }
    else {
      return context.ge
    }
  }

  getTagIndices() {
    if (!this.#tagIxs) {
      throw new Error('Attempting to tags from a data based evaluation result');
    }
    return this.#tagIxs;
  }
}

module.exports = {
  EvaluationResult,
};