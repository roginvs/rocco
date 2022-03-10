import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import {
  ExpressionNode,
  NodeLocator,
  DeclaratorId,
} from "./parser.definitions";
import { SymbolTable } from "./parser.symboltable";
import { createParser } from "./parser.funcs";

function checkExpressionSkip(str: string, ast?: ExpressionNode) {
  it.skip(`Reads '${str}'`, () => {});
}

function checkExpression(str: string, ast?: ExpressionNode) {
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
    declaratorNodeId: "arr" as DeclaratorId,
  });

  checkExpression("arr[2]", {
    type: "subscript operator",
    target: {
      type: "identifier",
      value: "arr",
      declaratorNodeId: "arr" as DeclaratorId,
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
        declaratorNodeId: "arr" as DeclaratorId,
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
      declaratorNodeId: "f" as DeclaratorId,
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
        declaratorNodeId: "f" as DeclaratorId,
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
        declaratorNodeId: "f" as DeclaratorId,
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
        declaratorNodeId: "f" as DeclaratorId,
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
          declaratorNodeId: "arr" as DeclaratorId,
        },
        index: {
          type: "postfix ++",
          target: {
            type: "identifier",
            value: "a",
            declaratorNodeId: "a" as DeclaratorId,
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
        declaratorNodeId: "kek" as DeclaratorId,
      },
    },
  });

  checkExpression("sizeof kek", {
    type: "sizeof expression",
    expression: {
      type: "identifier",
      value: "kek",
      declaratorNodeId: "kek" as DeclaratorId,
    },
  });

  checkExpression("sizeof(kek)", {
    type: "sizeof expression",
    expression: {
      type: "identifier",
      value: "kek",
      declaratorNodeId: "kek" as DeclaratorId,
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
      declaratorNodeId: "kek" as DeclaratorId,
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
          declaratorNodeId: "kek" as DeclaratorId,
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
      declaratorNodeId: "a" as DeclaratorId,
    },
    rvalue: {
      type: "assignment",
      operator: "=",
      lvalue: {
        type: "identifier",
        value: "b",
        declaratorNodeId: "b" as DeclaratorId,
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
        declaratorNodeId: "a" as DeclaratorId,
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
      declaratorNodeId: "a" as DeclaratorId,
    },
    rvalue: {
      type: "assignment",
      operator: ">>=",
      lvalue: {
        type: "identifier",
        value: "b",
        declaratorNodeId: "b" as DeclaratorId,
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
        declaratorNodeId: "a" as DeclaratorId,
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
          declaratorNodeId: "b" as DeclaratorId,
        },
        rvalue: { type: "const", subtype: "int", value: 3 },
      },
      effectiveValue: {
        type: "assignment",
        operator: "=",
        lvalue: {
          type: "identifier",
          value: "c",
          declaratorNodeId: "c" as DeclaratorId,
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
      declaratorNodeId: "f" as DeclaratorId,
    },
    args: [{ type: "const", subtype: "int", value: 2 }],
  });
  checkExpression("f()", {
    type: "function call",
    target: {
      type: "identifier",
      value: "f",
      declaratorNodeId: "f" as DeclaratorId,
    },
    args: [],
  });
  checkExpression("f(a=3, b=5, c++)", {
    type: "function call",
    target: {
      type: "identifier",
      value: "f",
      declaratorNodeId: "f" as DeclaratorId,
    },
    args: [
      {
        type: "assignment",
        operator: "=",
        lvalue: {
          type: "identifier",
          value: "a",
          declaratorNodeId: "a" as DeclaratorId,
        },
        rvalue: { type: "const", subtype: "int", value: 3 },
      },
      {
        type: "assignment",
        operator: "=",
        lvalue: {
          type: "identifier",
          value: "b",
          declaratorNodeId: "b" as DeclaratorId,
        },
        rvalue: { type: "const", subtype: "int", value: 5 },
      },
      {
        type: "postfix ++",
        target: {
          type: "identifier",
          value: "c",
          declaratorNodeId: "c" as DeclaratorId,
        },
      },
    ],
  });

  checkExpression("*(char*)arr++", {
    type: "unary-operator",
    operator: "*",
    target: {
      type: "cast",
      typename: {
        type: "pointer",
        const: false,
        pointsTo: {
          type: "arithmetic",
          arithmeticType: "char",
          const: false,
          signedUnsigned: null,
        },
      },
      target: {
        type: "postfix ++",
        target: { type: "identifier", value: "arr", declaratorNodeId: "arr" },
      },
    },
  });
});

// @TODO: Add throwing tests
