import { toTuple } from "../components/utils";

class Position {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

var assert = require("assert");
describe("Array", function() {
  describe("#toTuple()", function() {
    it("should return a tuple from the array", function() {
      let [x, y] = toTuple(new Position(1, 2));
      assert.equal(x, 1);
      assert.equal(y, 2);
    });
  });
});
