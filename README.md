# btriev
Boolean Retrieval on Hierarchical Attributes

## About
`btriev` is a query language that answers questions about boolean attributes of objects. For example, "Show me all
the books about horror or mystery." and "Which dishes contain cumin and not any variety of tumeric?" are questions 
`btriev` can answer.

## Install
```
npm install btriev
```

## Example
```js
const btriev = require('btriev');

const tags = [
                {
                  id: 1,
                  name: 'Action',
                },
                {
                  id: 2,
                  name: 'Superhero',
                },
                {
                  id: 3,
                  name: 'Adventure',
                },
                {
                  id: 4,
                  name: 'Kung Fu',
                },
                {
                  id: 5,
                  name: 'Western',
                },
                {
                  id: 6,
                  name: 'Mystery',
                }
             ];

const edges = [
                {
                  from: 1,
                  to: 2,
                },
                {
                  from: 1,
                  to: 3,
                },
                {
                  from: 1,
                  to: 4,
                },
                {
                  from: 3,
                  to: 5,
                },
              ];

const tagHierarchy = btriev.TagHierarchy.createFromEdgeList(edges, tags);
const dataStore = btriev.DataStore.fromUnsortedIndex({
  1: [10],
  2: [11, 12],
  4: [13, 15],
  5: [14],
  6: [10, 12, 14]
});

btriev.evaluate('Action* AND Mystery', dataStore, tagHierarchy); // [10, 12, 14]
btriev.evaluate('(Superhero or "Kung Fu") and not Mystery', dataStore, tagHierarchy); // [11, 13, 15]
```

## Docs

### Index
`DataStore` is `btriev`'s inverted index implementation. It stores which tags correspond to which data. This data
structure interacts entirely with tag and datum ids (i.e. should be unique `Number`s).

It is strongly recommended to construct a `DataStore` using its static constructor, `fromUnsortedIndex`,  which 
takes an object argument mapping tag ids to an array of data ids. Data ids do not have to be sorted or unique for this 
constructor. This constructor offers a second argument `allDataIds`, for specifying the full set of data ids in the
event some datum have no tags assigned.

### Tag hierarchy
`TagHierarchy` is `btriev`'s representation of a tag graph. It stores a lookup from tag names to tag ids and knows how
to traverse the tags. Contrary to the name, `TagHierarchy` can represent cyclical graphs, although this is not the 
expected use case.

`TagHierarchy` is most easily constructed from its static constructor `createFromEdgeList`. The first argument it
accepts is an array of objects with `to` and `from` attributes; these represent edges between tag ids. The second
argument is an array of objects with `id` and `name` attributes, representing the set of all tags. 

### Querying 
Within a query, operators are case insensitive. Tag names are matched on exact string equality and may be enclosed in 
double quotes. 

Operators are evaluated in order of precedence (see `Operators` section). Data operators are commutative and have
distinct precedence, so the local (left to right) ordering of operations is unspecified. The explosion operator has 
distinct precedence and is idempotent for subsequent calls, so ordering is irrelevant. The path operator is the only
operator where order of operations is important; as expected, it evaluates tags left to right (e.g. 
`grandparent > parent > child`).

#### Operators
In increasing order of precedence:
- `OR` computes the union of data matching the left and right expressions
- `AND` computes the intersection of data matching the left and right expressions 
- `NOT` computes the negation of data matching the right expression
- `*` (explosion operator) expands the left tag to include all "child" tags (as determined by a graph traversal)
- `>` (path operator) specifies an exact path to a tag (useful for duplicate tag names). 
- `"` is used to quote tag names. useful for tag names containing operator keywords. Escape a double quote within 
double quotes using the sequence `\"`.
- `(` & `)` contain expressions and specify the order of execution.

`AND`, `OR`, and `NOT` are data operators (they operate on the data index), while `*` and `>` are tag operators (they 
operate on the tag hierarchy).

#### Exceptions
`ParseError`s contain a message and offer a `getLocation()` method for determining string indices where the error 
originates.

#### Options

`allowUnknownTags` is an option of `evaluate` which determines how unknown tag names (i.e. those not in the tag 
hierarchy) are handled during query parsing and evaluation. When true, unknown tags are evaluated to an empty array of
data ids. When this option is false, an exception will be thrown.

#### Internals / External development
`btriev` exposes many of its internals, namely its query lexer and parser. This decision allows external tools to 
develop on top of `btriev`. 

![btriev](resources/btriev.png)
