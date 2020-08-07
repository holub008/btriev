
function recurseListCombinations(data) {
  if (data.length === 0) {
    return [];
  }
  else if (data.length === 1) {
    return data[0].map(x => [x]);
  }

  const focusList = data[0];
  const remainingLists = data.slice(1);
  const subCombinations = recurseListCombinations(remainingLists);

  const combinations = [];
  focusList.forEach(element => {
    subCombinations.forEach(sc => {
      // TODO not performant
      const copy = sc.slice();
      copy.unshift(element);
      combinations.push(copy);
    })
  });

  return combinations;
}

/**
 * note, the collector is mutated (in addition to being returned)
 */
function bfsCollect(root, adjacency, collector=new Set()) {
  adjacency[root].forEach(ix => {
    if (!collector.has(ix)) {
      collector.add(ix);
      bfsCollect(ix, adjacency, collector);
    }
  });

  return collector;
}

class TagHierarchy {

  static createFromEdgeList(edgeList, tags) {
    const tagIdToIndex = {};
    const tagNameToIndices = {};
    tags.forEach((t, ix) => {
      tagIdToIndex[t.id] = ix;
      if (!tagNameToIndices[t.name]) {
        tagNameToIndices[t.name] = [ix];
      }
      else {
        tagNameToIndices[t.name].push(ix);
      }
    });

    const adjacency = Array.from(Array(tags.length), () => []);
    edgeList.forEach(e => {
      const fromIx = tagIdToIndex[e.from];
      const toIx = tagIdToIndex[e.to];
      const fromArr = adjacency[fromIx];
      fromArr.push(toIx);
    });

    return new TagHierarchy(adjacency, tagNameToIndices);
  }

  /**
   * @param adjacency an array of array of indices, representing a sparse graph adjacency matrix
   * @param tagNameToIndices an object with key tag names and value index into the adjacency matrix
   */
  constructor(adjacency, tagNameToIndices) {
    this._adjacency = adjacency;
    this._tagNameToIndices = tagNameToIndices;
  }

  containsTag(name) {
    return this._tagNameToIndices[name] !== undefined;
  }

  getIndices(tagName) {
    const indices = this._tagNameToIndices[tagName];
    if (!indices) {
      return [];
    }

    return indices;
  }

  /**
   *
   * @param indexPath an array of arrays containing tag indices representing potential paths
   * @return an array of indices representing tags at the end of the path
   */
  getIndicesForPath(indexPath) {
    const candidatePaths = recurseListCombinations(indexPath);
    const matchingIndices = [];
    candidatePaths.forEach(p => {
      let exists = true;
      for (let ix = 0; ix < (p.length - 1); ix++) {
        const fromIx = p[ix];
        const toIx = p[ix + 1];
        if (!this._adjacency[fromIx].includes(toIx)) {
          exists = false;
        }
      }

      if (exists) {
        matchingIndices.push(p[p.length - 1]);
      }
    });

    return matchingIndices;
  }

  explode(indices) {
    // perform a BFS from the indices - note, the hierarchy should be a tree/forest, but still use a cycle-safe
    // implementation. we can safely share the collector, to the benefit of not repeating work
    const collector = new Set();
    indices.forEach(root => {
      collector.add(root);
      bfsCollect(root, this._adjacency, collector);
    });

    return [...collector]
  }
}

module.exports = {
  TagHierarchy,
};