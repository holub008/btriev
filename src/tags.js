
function buildInvertedIndex(names) {
  const index = {};
  names.forEach((n, ix) => {
    if (index[n]) {
      index[n].push(ix);
    }
    else {
      index[n] = [ix];
    }
  });

  return index;
}

function recurseListCombinations(data) {
  if (data.length === 0) {
    return [];
  }
  else if (data.length === 1) {
    return data[0];
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

class TagHierarchy {
  constructor(adjacency, orderedTagNames) {
    this._adjacency = adjacency;
    this._tagNames = orderedTagNames;
    this._tagNameToIndices =buildInvertedIndex(orderedTagNames);
  }

  containsTag(name) {
    return this._tagNameToIndices[name] !== undefined;
  }

  getIndices(namePath) {
    const allIds = namePath.map(n => this._tagNameToIndices[n]);

    const validPaths = [];


  }
}

module.exports