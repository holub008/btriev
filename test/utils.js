function setEqual(left, right) {
  if (left.size !== right.size) {
    console.error(`left and right have different sizes! ${left.size} vs. ${right.size}`)
    return false;
  }
  for (let a of left) {
    if (!right.has(a)) {
      console.error(`left:\n\n${[...left]} \n\nand right:\n\n${[...right]}\n\n sets have different elements (right missing at least element ${a}).`);
      return false;
    }
  }
  return true;
}

module.exports = {
  setEqual,
};