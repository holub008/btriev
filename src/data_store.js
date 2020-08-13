function sortIndex(index) {
  const sortedIndex = {};
  Object.entries(index).forEach(([tagId, dataIds]) => {
    sortedIndex[tagId] = dataIds.slice().sort((a, b) => a - b);
  })

  return sortedIndex;
}

function inferAllDataIds(index) {
  const uniqueDataIds = new Set();
  Object.values(index).forEach(dataIds => dataIds.forEach(did => uniqueDataIds.add(did)));
  return [...uniqueDataIds];
}

// TODO verify data ids are unique in each tag array
class DataStore {
  /**
   * if the data ids are not sorted in ascending order, use this entry point to sort
   * @param invertedIndex an index of tag id to an array data id
   * @param allDataIds an array of data ids
   *
   */
  static fromUnsortedIndex(invertedIndex, allDataIds=null) {
    let allDataIdsSorted;
    // if not supplied, we infer from the index
    if (!allDataIds) {
      allDataIdsSorted = inferAllDataIds(invertedIndex).sort((a, b) => a - b);
    }
    else {
      allDataIdsSorted = allDataIds.slice().sort((a, b) => a - b);
    }
    return new DataStore(sortIndex(invertedIndex), allDataIdsSorted);
  }

  #tagIdToDataIds;
  #allDataIds;

  /**
   * note - if your data are not sorted in advance, use the fromUnsortedIndex static ctor
   * @param invertedIndex an index of tag id to an array data id (MUST BE SORTED!)
   * @param allDataIds an array of all data ids - a superset of those in the index (MUST BE SORTED!)
   */
  constructor(invertedIndex, allDataIds) {
    this.#tagIdToDataIds = invertedIndex;
    this.#allDataIds = allDataIds;
  }

  getDataIdsForTagIds(tagIds) {
    const dataIds = new Set();
    tagIds.forEach(id => {
      const dids = this.#tagIdToDataIds[id];
      if (dids) {
        this.#tagIdToDataIds[id].forEach(did => {
          dataIds.add(did);
        });
      }
    });

    return [...dataIds].sort((a, b) => a - b);
  }

  getAllDataIds() {
    return this.#allDataIds;
  }
}

module.exports = {
  DataStore,
};