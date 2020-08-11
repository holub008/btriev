
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

    return new TagHierarchy(adjacency, tagNameToIndices, tagIdToIndex);
  }

  #adjacency;
  #tagNameToIds;
  #tagIdToIndex;
  #indexToTagId;

  /**
   * note, this constructor should effectively be treated as private - see static constructor createFromEdgeList
   * @param adjacency an array of array of indices, representing a sparse graph adjacency matrix
   * @param tagNameToIds an object with key tag names and value a list of ids
   * @param tagIdToIndex maps an external tag id to an index
   */
  constructor(adjacency, tagNameToIds, tagIdToIndex) {
    this.#adjacency = adjacency;
    this.#tagNameToIds = tagNameToIds;
    this.#tagIdToIndex = tagIdToIndex;

    const indexToTagId = {};
    Object.values(tagIdToIndex).forEach((id, ix) => {
      indexToTagId[ix] = id;
    });
    this.#indexToTagId = indexToTagId;
  }

  containsTag(name) {
    return this.#tagNameToIds[name] !== undefined;
  }

  getIds(tagName) {
    const ids = this.#tagNameToIds[tagName];
    if (!ids) {
      return [];
    }

    return ids;
  }

  /**
   *
   * @param idPath an array of arrays containing tag ids representing potential paths
   * @return an array of indices representing tags at the end of the path
   */
  getIdsForPath(idPath) {
    const indexPath = idPath.map(ids => ids.map(id => this.#tagIdToIndex[id]))
    const candidatePaths = recurseListCombinations(indexPath);
    const matchingIds = [];
    candidatePaths.forEach(p => {
      let exists = true;
      for (let ix = 0; ix < (p.length - 1); ix++) {
        const fromIx = p[ix];
        const toIx = p[ix + 1];
        if (!this.#adjacency[fromIx].includes(toIx)) {
          exists = false;
        }
      }

      if (exists) {
        matchingIds.push(this.#indexToTagId[p[p.length - 1]]);
      }
    });

    return matchingIds;
  }

  /**
   * @param ids an array of tag ids
   */
  explode(ids) {
    // perform a BFS from the ids - note, the hierarchy should be a tree/forest, but we still use a cycle-safe
    // implementation. we can safely share the collector, to the benefit of not repeating work
    const indices = ids.map(id => this.#tagIdToIndex[id]);
    const collector = new Set();
    indices.forEach(root => {
      collector.add(root);
      bfsCollect(root, this.#adjacency, collector);
    });

    return [...collector].map(ix => this.#indexToTagId[ix]);
  }
}

module.exports = {
  TagHierarchy,
};