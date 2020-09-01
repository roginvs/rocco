import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { ExpressionNode, NodeLocator } from "./parser.definitions";
import { SymbolTable } from "./parser.symboltable";
import { DeepPartial } from "./utils";
import { createParser } from "./parser";
import { DeclaratorId } from "./declaratorId";

function checkExpressionSkip(str: string, ast?: ExpressionNode) {
  it.skip(`Reads '${str}'`, () => {});
}

// TODO: Remove DeepPartial
function checkExpression(str: string, ast?: DeepPartial<ExpressionNode>) {
  it(`Reads '${str}'`, () => {
    const scanner = new Scanner(createScannerFunc(str));

    const locator: NodeLocator = new Map();
    const symbolTable = new SymbolTable(locator);
    symbolTable.enterScope();
    symbolTable.addEntry({
      type: "declarator",
      identifier: "f",
      functionSpecifier: null,
      storageSpecifier: null,
      typename: {
        type: "function",
        const: true,
        haveEndingEllipsis: false,
        parameters: [],
        returnType: {
          type: "void",
          const: false,
        },
      },
      declaratorId: "f" as DeclaratorId,
    });
    for (const v of ["a", "b", "c", "kek"]) {
      symbolTable.addEntry({
        type: "declarator",
        identifier: v,
        functionSpecifier: null,
        storageSpecifier: null,
        typename: {
          type: "arithmetic",
          const: true,
          arithmeticType: "char",
          signedUnsigned: null,
        },
        declaratorId: v as DeclaratorId,
      });
    }
    symbolTable.addEntry({
      type: "declarator",
      identifier: "arr",
      functionSpecifier: null,
      storageSpecifier: null,
      typename: {
        type: "array",
        const: true,
        size: null,
        elementsTypename: {
          type: "arithmetic",
          arithmeticType: "char",
          const: true,
          signedUnsigned: null,
        },
      },
      declaratorId: "arr" as DeclaratorId,
    });
    const parser = createParser(scanner, locator, symbolTable);
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

  checkExpression("arr", {
    type: "identifier",
    value: "arr",
  });

  checkExpression("arr[2]", {
    type: "subscript operator",
    target: {
      type: "identifier",
      value: "arr",
    },
    index: { type: "const", subtype: "int", value: 2 },
  });

  checkExpression("arr[2][4]", {
    type: "subscript operator",
    target: {
      type: "subscript operator",
      target: {
        type: "identifier",
        value: "arr",
      },
      index: { type: "const", subtype: "int", value: 2 },
    },
    index: { type: "const", subtype: "int", value: 4 },
  });

  checkExpression("f()", {
    type: "function call",
    target: {
      type: "identifier",
      value: "f",
    },
    args: [],
  });

  checkExpression("f().fghh", {
    type: "struct access",
    identifier: "fghh",
    target: {
      type: "function call",
      target: {
        type: "identifier",
        value: "f",
      },
      args: [],
    },
  });

  checkExpression("f()->fghh", {
    type: "struct pointer access",
    identifier: "fghh",
    target: {
      type: "function call",
      target: {
        type: "identifier",
        value: "f",
      },
      args: [],
    },
  });

  checkExpression("f()[arr[a++]++]", {
    type: "subscript operator",
    target: {
      type: "function call",
      target: {
        type: "identifier",
        value: "f",
      },
      args: [],
    },
    index: {
      type: "postfix ++",
      target: {
        type: "subscript operator",
        target: {
          type: "identifier",
          value: "arr",
        },
        index: {
          type: "postfix ++",
          target: {
            type: "identifier",
            value: "a",
          },
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
      target: {
        type: "identifier",
        value: "kek",
      },
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

  checkExpression("sizeof(int)", {
    type: "sizeof typename",
    typename: {
      type: "arithmetic",
      arithmeticType: "int",
      const: false,
      signedUnsigned: null,
    },
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

  checkExpression("(int)(kek)", {
    type: "cast",
    typename: {
      type: "arithmetic",
      arithmeticType: "int",
      const: false,
      signedUnsigned: null,
    },
    target: {
      type: "identifier",
      value: "kek",
    },
  });

  for (const x of ["(int)(char)(kek)", "(int)(char)kek"]) {
    checkExpression(x, {
      type: "cast",
      typename: {
        type: "arithmetic",
        arithmeticType: "int",
        const: false,
        signedUnsigned: null,
      },
      target: {
        type: "cast",
        typename: {
          type: "arithmetic",
          arithmeticType: "char",
          const: false,
          signedUnsigned: null,
        },
        target: {
          type: "identifier",
          value: "kek",
        },
      },
    });
  }

  checkExpression("2+2", {
    type: "binary operator",
    left: { type: "const", subtype: "int", value: 2 },
    right: { type: "const", subtype: "int", value: 2 },
    operator: "+",
  });

  checkExpression("2 + (int)4/3++*-2", {
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
          type: "cast",
          typename: {
            type: "arithmetic",
            arithmeticType: "int",
            const: false,
            signedUnsigned: null,
          },
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

  checkExpression("a = b = 4", {
    type: "assignment",
    operator: "=",
    lvalue: {
      type: "identifier",
      value: "a",
    },
    rvalue: {
      type: "assignment",
      operator: "=",
      lvalue: {
        type: "identifier",
        value: "b",
      },
      rvalue: { type: "const", subtype: "int", value: 4 },
    },
  });

  checkExpression("a++ += 2", {
    type: "assignment",
    operator: "+=",
    lvalue: {
      type: "postfix ++",
      target: {
        type: "identifier",
        value: "a",
      },
    },
    rvalue: { type: "const", subtype: "int", value: 2 },
  });

  checkExpression("a *= b >>= 2 + 3", {
    type: "assignment",
    operator: "*=",
    lvalue: {
      type: "identifier",
      value: "a",
    },
    rvalue: {
      type: "assignment",
      operator: ">>=",
      lvalue: {
        type: "identifier",
        value: "b",
      },
      rvalue: {
        type: "binary operator",
        operator: "+",
        left: { type: "const", subtype: "int", value: 2 },
        right: { type: "const", subtype: "int", value: 3 },
      },
    },
  });

  checkExpression("a = 2, b = 3, c = 4", {
    type: "expression with sideeffect",
    sizeeffect: {
      type: "assignment",
      operator: "=",
      lvalue: {
        type: "identifier",
        value: "a",
      },
      rvalue: { type: "const", subtype: "int", value: 2 },
    },
    effectiveValue: {
      type: "expression with sideeffect",
      sizeeffect: {
        type: "assignment",
        operator: "=",
        lvalue: {
          type: "identifier",
          value: "b",
        },
        rvalue: { type: "const", subtype: "int", value: 3 },
      },
      effectiveValue: {
        type: "assignment",
        operator: "=",
        lvalue: {
          type: "identifier",
          value: "c",
        },
        rvalue: { type: "const", subtype: "int", value: 4 },
      },
    },
  });

  checkExpression("f(2)", {
    type: "function call",
    target: {
      type: "identifier",
      value: "f",
    },
    args: [{ type: "const", subtype: "int", value: 2 }],
  });
  checkExpression("f()", {
    type: "function call",
    target: {
      type: "identifier",
      value: "f",
    },
    args: [],
  });
  checkExpression("f(a=3, b=5, c++)", {
    type: "function call",
    target: {
      type: "identifier",
      value: "f",
    },
    args: [
      {
        type: "assignment",
        operator: "=",
        lvalue: {
          type: "identifier",
          value: "a",
        },
        rvalue: { type: "const", subtype: "int", value: 3 },
      },
      {
        type: "assignment",
        operator: "=",
        lvalue: {
          type: "identifier",
          value: "b",
        },
        rvalue: { type: "const", subtype: "int", value: 5 },
      },
      {
        type: "postfix ++",
        target: {
          type: "identifier",
          value: "c",
        },
      },
    ],
  });
});

// @TODO: Add throwing tests
