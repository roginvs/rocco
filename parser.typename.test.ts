import { createParser } from "./parser.funcs";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { Typename, NodeLocator } from "./parser.definitions";
import { SymbolTable } from "./parser.symboltable";
import { DeclaratorId } from "./declaratorId";

describe("isCurrentTokenLooksLikeTypeName", () => {
  const YES = [
    "int",
    "void",
    "struct",
    "const",
    "signed",
    "unsigned",
    "kekeke",
  ];
  const NO = ["2" /* todo: add symbol table */, "kek", "2+4", "/", "++4"];

  for (const t of [
    ...YES.map((s) => ({ s, yes: true })),
    ...NO.map((s) => ({ s, yes: false })),
  ]) {
    it(`Expects ${t.s} = ${t.yes}`, () => {
      const scanner = new Scanner(createScannerFunc(t.s));
      const locator: NodeLocator = new Map();

      const symbolTable = new SymbolTable(locator);
      symbolTable.enterScope();
      symbolTable.addEntry({
        type: "declarator",
        identifier: "kekeke",
        storageSpecifier: "typedef",

        typename: {
          type: "arithmetic",
          arithmeticType: "int",
          const: false,
          signedUnsigned: null,
        },
        functionSpecifier: null,
        declaratorId: "kekeke" as DeclaratorId,
      });
      const parser = createParser(scanner, locator, symbolTable);
      expect(parser.isCurrentTokenLooksLikeTypeName()).toStrictEqual(t.yes);
    });
  }
});

function checkTypename(str: string, ast?: Typename) {
  it(`Reads '${str}'`, () => {
    const scanner = new Scanner(createScannerFunc(str));
    const locator: NodeLocator = new Map();

    const symbolTable = new SymbolTable(locator);
    const parser = createParser(scanner, locator, symbolTable);
    symbolTable.enterScope();
    symbolTable.addEntry({
      type: "declarator",
      identifier: "p_int",
      functionSpecifier: null,
      storageSpecifier: null,
      typename: {
        type: "pointer",
        const: false,
        pointsTo: {
          type: "arithmetic",
          arithmeticType: "int",
          const: false,
          signedUnsigned: null,
        },
      },
      declaratorId: "p_int" as DeclaratorId,
    });
    const node = parser.readTypeName();
    if (ast) {
      expect(node).toMatchObject(ast);
    } else {
      console.info(JSON.stringify(node));
    }

    expect(scanner.current().type).toBe("end");
  });
}

describe("Parsing typename", () => {
  function checkFailingType(str: string) {
    it(`Throws on '${str}'`, () => {
      const scanner = new Scanner(createScannerFunc(str));
      const locator: NodeLocator = new Map();

      const parser = createParser(scanner, locator, new SymbolTable(locator));
      expect(() => parser.readTypeName()).toThrow();
    });
  }

  checkFailingType("const");
  checkFailingType("const const int");
  checkFailingType("const unsigned unsigned int");
  checkFailingType("const unsigned signed int");
  checkFailingType("const void");
  checkFailingType("void const");
  checkFailingType("void unsigned");
  checkFailingType("signed void");

  checkTypename("const int", {
    type: "arithmetic",
    arithmeticType: "int",
    const: true,
    signedUnsigned: null,
  });

  checkTypename("int", {
    type: "arithmetic",
    arithmeticType: "int",
    const: false,
    signedUnsigned: null,
  });
  checkTypename("const unsigned char", {
    type: "arithmetic",
    arithmeticType: "char",
    signedUnsigned: "unsigned",
    const: true,
  });

  checkTypename("char **const", {
    type: "pointer",
    pointsTo: {
      type: "pointer",
      pointsTo: {
        type: "arithmetic",
        arithmeticType: "char",
        const: false,
        signedUnsigned: null,
      },
      const: false,
    },
    const: true,
  });
  checkTypename("char *const*", {
    type: "pointer",
    pointsTo: {
      type: "pointer",
      pointsTo: {
        type: "arithmetic",
        arithmeticType: "char",
        const: false,
        signedUnsigned: null,
      },
      const: true,
    },
    const: false,
  });

  checkTypename("char *[3][7]", {
    type: "array",
    size: { type: "const", subtype: "int", value: 3 },
    const: true,
    elementsTypename: {
      type: "array",
      const: true,
      size: { type: "const", subtype: "int", value: 7 },
      elementsTypename: {
        type: "pointer",
        pointsTo: {
          type: "arithmetic",
          arithmeticType: "char",
          const: false,
          signedUnsigned: null,
        },
        const: false,
      },
    },
  });

  checkTypename("char (*)[33]", {
    type: "pointer",
    pointsTo: {
      type: "array",
      const: true,
      size: { type: "const", subtype: "int", value: 33 },
      elementsTypename: {
        type: "arithmetic",
        arithmeticType: "char",
        const: false,
        signedUnsigned: null,
      },
    },
    const: false,
  });

  checkTypename("char * const (* const *)[5][10]", {
    type: "pointer",
    const: false,
    pointsTo: {
      type: "pointer",
      const: true,
      pointsTo: {
        type: "array",
        size: { type: "const", subtype: "int", value: 5 },
        const: true,
        elementsTypename: {
          type: "array",
          const: true,
          size: { type: "const", subtype: "int", value: 10 },
          elementsTypename: {
            type: "pointer",
            const: true,
            pointsTo: {
              type: "arithmetic",
              arithmeticType: "char",
              const: false,
              signedUnsigned: null,
            },
          },
        },
      },
    },
  });

  checkFailingType("char (*)(*)[2][][*]");

  checkTypename("char [*p_int]", {
    type: "array",
    const: true,
    size: {
      type: "unary-operator",
      operator: "*",
      target: {
        type: "identifier",
        value: "p_int",
        declaratorNodeId: "p_int" as DeclaratorId,
      },
    },
    elementsTypename: {
      type: "arithmetic",
      arithmeticType: "char",
      const: false,
      signedUnsigned: null,
    },
  });

  checkTypename("char (int x)", {
    type: "function",
    const: true,
    haveEndingEllipsis: false,
    parameters: [
      {
        type: "declarator",
        functionSpecifier: null,
        storageSpecifier: null,
        identifier: "x",
        typename: {
          type: "arithmetic",
          arithmeticType: "int",
          const: false,
          signedUnsigned: null,
        },
        declaratorId: "0001" as DeclaratorId,
      },
    ],
    returnType: {
      type: "arithmetic",
      arithmeticType: "char",
      const: false,
      signedUnsigned: null,
    },
  });

  checkTypename("char (*(*)[])(int * param1, int (),...)", {
    type: "pointer",
    const: false,
    pointsTo: {
      type: "array",
      const: true,
      size: null,
      elementsTypename: {
        type: "pointer",
        const: false,
        pointsTo: {
          type: "function",
          const: true,
          haveEndingEllipsis: true,
          parameters: [
            {
              type: "declarator",
              functionSpecifier: null,
              storageSpecifier: null,
              identifier: "param1",
              typename: {
                type: "pointer",
                const: false,
                pointsTo: {
                  type: "arithmetic",
                  arithmeticType: "int",
                  const: false,
                  signedUnsigned: null,
                },
              },
              declaratorId: "0002" as DeclaratorId,
            },
            {
              type: "function",
              const: true,
              haveEndingEllipsis: false,
              parameters: [],
              returnType: {
                type: "arithmetic",
                arithmeticType: "int",
                const: false,
                signedUnsigned: null,
              },
            },
          ],
          returnType: {
            type: "arithmetic",
            arithmeticType: "char",
            const: false,
            signedUnsigned: null,
          },
        },
      },
    },
  });

  // https://www.geeksforgeeks.org/complicated-declarations-in-c/
  checkTypename("char (*(*())[]) ()", {
    type: "function",
    const: true,
    haveEndingEllipsis: false,
    parameters: [],
    returnType: {
      type: "pointer",
      const: false,
      pointsTo: {
        type: "array",
        const: true,
        size: null,
        elementsTypename: {
          type: "pointer",
          const: false,
          pointsTo: {
            type: "function",
            const: true,
            haveEndingEllipsis: false,
            parameters: [],
            returnType: {
              type: "arithmetic",
              arithmeticType: "char",
              const: false,
              signedUnsigned: null,
            },
          },
        },
      },
    },
  });

  // TODO
  describe.skip("Skipped", () => checkTypename("struct tag (*[5])(float)"));
});
