describe('tag hierarchy', function () {


  it('should produce a depth 1 AST', function () {
    const target = new ast.Node(tkSequence[1], ops.Operators.and);
    target.addChild(new ast.Node(tkSequence[0]));
    target.addChild(new ast.Node(tkSequence[2]));

    assert.ok(ast.nodesEqual(parser.parse(tkSequence), target, true));
  });
});