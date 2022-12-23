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

function preconditionSubset(indexIds, allIds) {
  let currentIx = 0;
  indexIds.forEach((id) => {
    while (currentIx < allIds.length) {
      if (allIds[currentIx] === id) {
        return;
      } else {
        currentIx += 1;
      }
    }
    throw new Error(
        `Data id ${id} is given in the index, but was not supplied in allDataIds. This condition will
        lead to inaccurate queries, failing fast.`)
  });
}

class DataStore {
  /**
   * if the data ids are not unique sorted in ascending order, use this entry point to sort
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
      const inferredIdsSorted = inferAllDataIds(invertedIndex).sort((a, b) => a - b);
      allDataIdsSorted = ([...new Set(allDataIds)]).sort((a, b) => a - b);
      preconditionSubset(inferredIdsSorted, allDataIdsSorted);
    }
    return new DataStore(sortIndex(invertedIndex), allDataIdsSorted);
  }

  /**
   * note - if your data are not unique and sorted in advance, use the fromUnsortedIndex static ctor
   * @param invertedIndex an index of tag id to an array data id (MUST BE SORTED!)
   * @param allDataIds an array of all data ids - a superset of those in the index (MUST BE SORTED!)
   */
  constructor(invertedIndex, allDataIds) {
    this._tagIdToDataIds = invertedIndex;
    this._allDataIds = allDataIds;
  }

  getDataIdsForTagIds(tagIds) {
    const dataIds = new Set();
    tagIds.forEach(id => {
      const dids = this._tagIdToDataIds[id];
      if (dids) {
        this._tagIdToDataIds[id].forEach(did => {
          dataIds.add(did);
        });
      }
    });

    return [...dataIds].sort((a, b) => a - b);
  }

  getAllDataIds() {
    return this._allDataIds;
  }
}

module.exports = {
  DataStore,
};