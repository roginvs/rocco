import { createParser } from "./parser.expression";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { assert } from "console";

function parse(str: string) {
  return createParser(new Scanner(createScannerFunc(str)));
}

describe("Parser test", () => {
  it("Reads primary expression number int", () => {
    const scanner = new Scanner(createScannerFunc("123"));
    const parser = createParser(scanner);
    const node = parser.readPrimaryExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "int",
      value: 123,
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads primary expression number float", () => {
    const scanner = new Scanner(createScannerFunc("123.5"));
    const parser = createParser(scanner);
    const node = parser.readPrimaryExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "float",
      value: 123.5,
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads primary expression char", () => {
    const scanner = new Scanner(createScannerFunc("'a'"));
    const parser = createParser(scanner);
    const node = parser.readPrimaryExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "char",
      value: "a".charCodeAt(0),
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads primary expression identifier", () => {
    const scanner = new Scanner(createScannerFunc("asdf"));
    const parser = createParser(scanner);
    const node = parser.readPrimaryExpression();
    expect(node).toMatchObject({
      type: "identifier",
      value: "asdf",
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads postfix expression subscript", () => {
    const scanner = new Scanner(createScannerFunc("asd[2]"));
    const parser = createParser(scanner);

    const node = parser.readPostfixExpression();
    expect(node).toMatchObject({
      type: "subscript operator",
      target: {
        type: "identifier",
        value: "asd",
      },
      index: { type: "const", subtype: "int", value: 2 },
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads postfix expression, nested subscript", () => {
    const scanner = new Scanner(createScannerFunc("zxc[2][4]"));
    const parser = createParser(scanner);

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

    expect(scanner.current().type).toBe("end");
  });

  it("Reads postfix expression, function call", () => {
    const scanner = new Scanner(createScannerFunc("qwe()"));
    const parser = createParser(scanner);

    const node = parser.readPostfixExpression();

    expect(node).toMatchObject({
      type: "function call",
      target: { type: "identifier", value: "qwe" },
      args: [],
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads postfix expression, struct access", () => {
    const scanner = new Scanner(createScannerFunc("qwe().fghh"));
    const parser = createParser(scanner);
    const node = parser.readPostfixExpression();

    expect(node).toMatchObject({
      type: "struct access",
      field: { type: "identifier", value: "fghh" },
      target: {
        type: "function call",
        target: { type: "identifier", value: "qwe" },
        args: [],
      },
    });

    expect(scanner.current().type).toBe("end");
  });
});
