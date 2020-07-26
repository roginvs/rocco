import { createExpressionParser, ExpressionNode } from "./parser.expression";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";

describe("Parser test", () => {
  it("Reads primary expression number int", () => {
    const scanner = new Scanner(createScannerFunc("123"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "int",
      value: 123,
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads primary expression number int with brackets", () => {
    const scanner = new Scanner(createScannerFunc("((223))"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "int",
      value: 223,
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads primary expression number float", () => {
    const scanner = new Scanner(createScannerFunc("123.5"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "float",
      value: 123.5,
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads primary expression char", () => {
    const scanner = new Scanner(createScannerFunc("'a'"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();
    expect(node).toMatchObject({
      type: "const",
      subtype: "char",
      value: "a".charCodeAt(0),
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads primary expression identifier", () => {
    const scanner = new Scanner(createScannerFunc("asdf"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();
    expect(node).toMatchObject({
      type: "identifier",
      value: "asdf",
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads postfix expression subscript", () => {
    const scanner = new Scanner(createScannerFunc("asd[2]"));
    const parser = createExpressionParser(scanner);

    const node = parser.readExpression();
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
    const parser = createExpressionParser(scanner);

    const node = parser.readExpression();
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
    const parser = createExpressionParser(scanner);

    const node = parser.readExpression();

    expect(node).toMatchObject({
      type: "function call",
      target: { type: "identifier", value: "qwe" },
      args: [],
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads postfix expression, struct access", () => {
    const scanner = new Scanner(createScannerFunc("qwe().fghh"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();

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

  it("Reads postfix expression, struct pointer access", () => {
    const scanner = new Scanner(createScannerFunc("qwe()->fghh"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();

    expect(node).toMatchObject({
      type: "struct pointer access",
      field: { type: "identifier", value: "fghh" },
      target: {
        type: "function call",
        target: { type: "identifier", value: "qwe" },
        args: [],
      },
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads postfix expression, ++", () => {
    const scanner = new Scanner(createScannerFunc("qwe()[arr[n++]++]"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();

    expect(node).toMatchObject({
      type: "subscript operator",
      target: {
        type: "function call",
        target: { type: "identifier", value: "qwe" },
        args: [],
      },
      index: {
        type: "postfix ++",
        target: {
          type: "subscript operator",
          target: { type: "identifier", value: "arr" },
          index: {
            type: "postfix ++",
            target: { type: "identifier", value: "n" },
          },
        },
      },
    });
    expect(scanner.current().type).toBe("end");
  });

  it("Reads unary expression 1", () => {
    const scanner = new Scanner(createScannerFunc("++--88++"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();
    expect(node).toMatchObject({
      type: "prefix ++",
      target: {
        type: "prefix --",
        target: {
          type: "postfix ++",
          target: { type: "const", subtype: "int", value: 88 },
        },
      },
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads unary expression 2", () => {
    const scanner = new Scanner(createScannerFunc("*+kek"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();

    expect(node).toMatchObject({
      type: "unary-operator",
      operator: "*",
      target: {
        type: "unary-operator",
        operator: "+",
        target: { type: "identifier", value: "kek" },
      },
    });

    expect(scanner.current().type).toBe("end");
  });

  it("Reads unary expression, sizeof kek", () => {
    const scanner = new Scanner(createScannerFunc("sizeof kek"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();

    expect(node).toMatchObject({
      type: "sizeof",
      //@TODO: Add case with type!
      target: {
        expression: { type: "identifier", value: "kek" },
        // typename: undefined,
      },
    });

    expect(scanner.current().type).toBe("end");
  });

  it.skip("Reads unary expression, sizeof (int)", () => {
    const scanner = new Scanner(createScannerFunc("sizeof (int)"));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();
    //console.info(JSON.stringify(node));
    expect(node).toMatchObject({
      type: "sizeof",
      target: {
        expression: undefined,
        typename: {
          type: "simple type",
          typename: "int",
        },
      },
    });

    expect(scanner.current().type).toBe("end");
  });

  for (const [prefix, suffix] of [
    ["", ""],
    ["(", ")"],
    ["((", "))"],
  ] as const) {
    it(`Reads cast expression '${prefix}3++${suffix}'`, () => {
      const scanner = new Scanner(createScannerFunc(`${prefix}3++${suffix}`));
      const parser = createExpressionParser(scanner);
      const node = parser.readExpression();
      //console.info(JSON.stringify(node));
      expect(node).toMatchObject({
        type: "postfix ++",
        target: { type: "const", subtype: "int", value: 3 },
      });

      expect(scanner.current().type).toBe("end");
    });
  }

  it.skip(`Reads cast expression (int)(kek)`, () => {
    const scanner = new Scanner(createScannerFunc(`(int)(kek)`));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();

    expect(node).toMatchObject({
      type: "typecast",
      target: { type: "identifier", value: "kek" },
      typename: { type: "simple type", typename: "int" },
    });

    expect(scanner.current().type).toBe("end");
  });

  it.skip(`Reads cast expression (int)(int)(kek)`, () => {
    const scanner = new Scanner(createScannerFunc(`(int)(int)(kek)`));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();

    expect(node).toMatchObject({
      type: "typecast",
      target: {
        type: "typecast",
        target: { type: "identifier", value: "kek" },
        typename: { type: "simple type", typename: "int" },
      },
      typename: { type: "simple type", typename: "int" },
    });

    expect(scanner.current().type).toBe("end");
  });

  it.skip(`Reads cast expression (int)(int)(kek)`, () => {
    const scanner = new Scanner(createScannerFunc(`(int)(int)kek`));
    const parser = createExpressionParser(scanner);
    const node = parser.readExpression();

    expect(node).toMatchObject({
      type: "typecast",
      target: {
        type: "typecast",
        target: { type: "identifier", value: "kek" },
        typename: { type: "simple type", typename: "int" },
      },
      typename: { type: "simple type", typename: "int" },
    });

    expect(scanner.current().type).toBe("end");
  });

  function checkExpression(str: string, ast?: ExpressionNode) {
    if (ast) {
      it(`Reads '${str}'`, () => {
        const scanner = new Scanner(createScannerFunc(str));
        const parser = createExpressionParser(scanner);
        const node = parser.readExpression();

        expect(node).toMatchObject(ast);

        expect(scanner.current().type).toBe("end");
      });
    } else {
      it.skip(`Reads '${str}'`, () => {
        const scanner = new Scanner(createScannerFunc(str));
        const parser = createExpressionParser(scanner);
        const node = parser.readExpression();

        console.info(JSON.stringify(node));

        expect(scanner.current().type).toBe("end");
      });
    }
  }

  checkExpression("2+2", {
    type: "binary operator",
    left: { type: "const", subtype: "int", value: 2 },
    right: { type: "const", subtype: "int", value: 2 },
    operator: "+",
  });

  checkExpression(
    "2 + (int)4/3++*-2" /* {
    type: "binary operator",
    operator: "+",
    left: { type: "const", subtype: "int", value: 2 },
    right: {
      type: "binary operator",
      operator: "*",
      left: {
        type: "binary operator",
        operator: "/",
        left: {
          type: "typecast",
          target: { type: "const", subtype: "int", value: 4 },
          //typename: { type: "simple type", typename: "int" },
        },
        right: {
          type: "postfix ++",
          target: { type: "const", subtype: "int", value: 3 },
        },
      },
      right: {
        type: "unary-operator",
        operator: "-",
        target: { type: "const", subtype: "int", value: 2 },
      },
    },
  }
  */
  );

  checkExpression("2?3?4:5:6", {
    type: "conditional expression",
    condition: { type: "const", subtype: "int", value: 2 },
    iftrue: {
      type: "conditional expression",
      condition: { type: "const", subtype: "int", value: 3 },
      iftrue: { type: "const", subtype: "int", value: 4 },
      iffalse: { type: "const", subtype: "int", value: 5 },
    },
    iffalse: { type: "const", subtype: "int", value: 6 },
  });

  checkExpression("2?3:4?5:6", {
    type: "conditional expression",
    condition: { type: "const", subtype: "int", value: 2 },
    iftrue: { type: "const", subtype: "int", value: 3 },
    iffalse: {
      type: "conditional expression",
      condition: { type: "const", subtype: "int", value: 4 },
      iftrue: { type: "const", subtype: "int", value: 5 },
      iffalse: { type: "const", subtype: "int", value: 6 },
    },
  });
});
