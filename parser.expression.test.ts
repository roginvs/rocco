import { createParser } from "./parser.expression";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { assert } from "console";

function parse(str: string) {
  return createParser(new Scanner(createScannerFunc(str)));
}

describe("Parser test", () => {
  it("Reads primary expression number int", () => {
    const parser = parse("123");
    const node = parser.readPrimaryExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "int",
      value: 123,
    });
  });

  it("Reads primary expression number float", () => {
    const parser = parse("123.5");
    const node = parser.readPrimaryExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "float",
      value: 123.5,
    });
  });

  it("Reads primary expression char", () => {
    const parser = parse("'a'");
    const node = parser.readPrimaryExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "char",
      value: "a".charCodeAt(0),
    });
  });

  it("Reads primary expression identifier", () => {
    const parser = parse("asdf");
    const node = parser.readPrimaryExpression();
    expect(node).toMatchObject({
      type: "identifier",
      value: "asdf",
    });
  });

  it("Reads postfix expression subscript", () => {
    const parser = parse("asd[2]");
    const node = parser.readPostfixExpression();
    expect(node).toMatchObject({
      type: "subscript operator",
      target: {
        type: "identifier",
        value: "asd",
      },
      index: { type: "const", subtype: "int", value: 2 },
    });
  });

  it("Reads postfix expression, nested subscript", () => {
    const parser = parse("zxc[2][4]");
    const node = parser.readPostfixExpression();
    expect(node).toMatchObject({
      type: "subscript operator",
      target: {
        type: "subscript operator",
        target: { type: "identifier", value: "zxc" },
        index: { type: "const", subtype: "int", value: 2 },
      },
      index: { type: "const", subtype: "int", value: 4 },
    });
  });

  it("Reads postfix expression, function call", () => {
    const parser = parse("qwe()");
    const node = parser.readPostfixExpression();
    console.info(node);
    expect(node).toMatchObject({
      type: "function call",
      target: { type: "identifier", value: "qwe" },
      args: [],
    });
  });
});
