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
    return new EvaluationResult(undefined, hierarchy.getIds(tagName));
  }

  static fromData(dataIxs) {
    return new EvaluationResult(dataIxs);
  }

  static fromTagIds(tagIds) {
    return new EvaluationResult(undefined, tagIds);
  }

  #dataIds;
  #tagIds;

  constructor(dataIds, tagIds) {
    if (!dataIds && !tagIds) {
      throw new Error('Cannot construct an evaluation result without either tags or data');
    }

    if (dataIds && tagIds) {
      throw new Error('Cannot construct an evaluation result with both tags and data');
    }

    this.#dataIds = dataIds;
    this.#tagIds = tagIds;
  }

  /**
   * for data operations, return the result as ids
   * for tag operations, lazily evaluate which data pertain to the previously specified tag(s)
   * @param context an EvaluationContext object
   */
  getDataIds(context) {
    if (this.#dataIds) {
      return this.#dataIds;
    }
    else {
      return context.getDataStore().getDataIdsForTagIds(this.#tagIds);
    }
  }

  getTagIds() {
    if (!this.#tagIds) {
      throw new Error('Attempting to tags from a data based evaluation result');
    }
    return this.#tagIds;
  }
}

module.exports = {
  EvaluationResult,
};