import { createParser } from "./parser";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { assert } from "console";

function parse(str: string) {
  return createParser(new Scanner(createScannerFunc(str)));
}

describe("Parser test", () => {
  it("Reads primary expression", () => {
    const parser = parse("123");
    const node = parser.readPrimaryExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "int",
      value: 123,
    });
  });
});
