import {
  createExpressionParser,
  ExpressionRequirements,
} from "./parser.expression";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { ExpressionNode } from "./parser.definitions";

function checkExpressionSkip(str: string, ast?: ExpressionNode) {
  it.skip(`Reads '${str}'`, () => {});
}

function checkExpression(str: string, ast?: ExpressionNode) {
  it(`Reads '${str}'`, () => {
    const scanner = new Scanner(createScannerFunc(str));

    const mockedTypeparser: ExpressionRequirements = {
      isCurrentTokenLooksLikeTypeName() {
        return false;
      },
      readTypeName() {
        throw new Error("not implemented in mocked version");
      },
    };
    const parser = createExpressionParser(scanner, mockedTypeparser);
    const node = parser.readExpression();

    if (ast) {
      expect(node).toMatchObject(ast);
    } else {
      console.info(JSON.stringify(node));
    }
    expect(scanner.current().type).toBe("end");
  });
}

describe("Parser test", () => {
  checkExpression("123", {
    type: "const",
    subtype: "int",
    value: 123,
  });

  checkExpression("((223))", {
    type: "const",
    subtype: "int",
    value: 223,
  });

  checkExpression("123.5", {
    type: "const",
    subtype: "float",
    value: 123.5,
  });

  checkExpression("'a'", {
    type: "const",
    subtype: "char",
    value: "a".charCodeAt(0),
  });

  checkExpression("asdf", {
    type: "identifier",
    value: "asdf",
  });

  checkExpression("asd[2]", {
    type: "subscript operator",
    target: {
      type: "identifier",
      value: "asd",
    },
    index: { type: "const", subtype: "int", value: 2 },
  });

  checkExpression("zxc[2][4]", {
    type: "subscript operator",
    target: {
      type: "subscript operator",
      target: { type: "identifier", value: "zxc" },
      index: { type: "const", subtype: "int", value: 2 },
    },
    index: { type: "const", subtype: "int", value: 4 },
  });

  checkExpression("qwe()", {
    type: "function call",
    target: { type: "identifier", value: "qwe" },
    args: [],
  });

  checkExpression("qwe().fghh", {
    type: "struct access",
    field: { type: "identifier", value: "fghh" },
    target: {
      type: "function call",
      target: { type: "identifier", value: "qwe" },
      args: [],
    },
  });

  checkExpression("qwe()->fghh", {
    type: "struct pointer access",
    field: { type: "identifier", value: "fghh" },
    target: {
      type: "function call",
      target: { type: "identifier", value: "qwe" },
      args: [],
    },
  });

  checkExpression("qwe()[arr[n++]++]", {
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

  checkExpression("++--88++", {
    type: "prefix ++",
    target: {
      type: "prefix --",
      target: {
        type: "postfix ++",
        target: { type: "const", subtype: "int", value: 88 },
      },
    },
  });

  checkExpression("*+kek", {
    type: "unary-operator",
    operator: "*",
    target: {
      type: "unary-operator",
      operator: "+",
      target: { type: "identifier", value: "kek" },
    },
  });

  checkExpression("sizeof kek", {
    type: "sizeof expression",
    expression: {
      type: "identifier",
      value: "kek",
    },
  });

  checkExpression("sizeof(kek)", {
    type: "sizeof expression",
    expression: {
      type: "identifier",
      value: "kek",
    },
  });

  it.skip("Reads unary expression, sizeof (int)", () => {
    const scanner = new Scanner(createScannerFunc("sizeof (int)"));
    const parser = createExpressionParser(scanner, null as any);
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
    checkExpression(`${prefix}3++${suffix}`, {
      type: "postfix ++",
      target: { type: "const", subtype: "int", value: 3 },
    });
  }

  it.skip(`Reads cast expression (int)(kek)`, () => {
    const scanner = new Scanner(createScannerFunc(`(int)(kek)`));
    const parser = createExpressionParser(scanner, null as any);
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
    const parser = createExpressionParser(scanner, null as any);
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
    const parser = createExpressionParser(scanner, null as any);
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

  checkExpression("2+2", {
    type: "binary operator",
    left: { type: "const", subtype: "int", value: 2 },
    right: { type: "const", subtype: "int", value: 2 },
    operator: "+",
  });

  /*
  checkExpressionSkip("2 + (int)4/3++*-2", {
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
  });
  */

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

// @TODO: Add throwing tests
