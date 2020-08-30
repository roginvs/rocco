import { DeepPartial } from "./utils";
import { ExternalDeclarations, NodeLocator } from "./parser.definitions";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { createParser } from "./parser";
import { SymbolTable } from "./parser.symboltable";

// TODO: Remove DeepPartial
function checkExternalDeclaration(
  str: string,
  ast?: DeepPartial<ExternalDeclarations>
) {
  it(`Reads '${str}'`, () => {
    const scanner = new Scanner(createScannerFunc(str));
    const locator: NodeLocator = new Map();
    const symbolTable = new SymbolTable(locator);
    const parser = createParser(scanner, locator, symbolTable);
    symbolTable.enterScope();
    const node = parser.readExternalDeclaration();
    if (ast) {
      expect(node).toMatchObject(ast);
    } else {
      console.info(JSON.stringify(node));
    }

    expect(scanner.current().type).toBe("end");
  });
}

function checkFailingExternalDeclaration(str: string) {
  it(`Throws on '${str}'`, () => {
    const scanner = new Scanner(createScannerFunc(str));
    const locator: NodeLocator = new Map();

    const parser = createParser(scanner, locator, new SymbolTable(locator));
    expect(() => parser.readExternalDeclaration()).toThrow();
  });
}

describe("External declaration functions", () => {
  checkExternalDeclaration("inline int f() {}", [
    {
      type: "function-declaration",
      declaration: {
        type: "declarator",
        functionSpecifier: "inline",
        storageSpecifier: null,
        identifier: "f",
        typename: {
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
      },
      body: [],
      declaredVariables: [],
    },
  ]);
  checkExternalDeclaration("int* f(char a, char b) {}", [
    {
      type: "function-declaration",
      declaration: {
        type: "declarator",
        functionSpecifier: null,
        storageSpecifier: null,
        identifier: "f",
        typename: {
          type: "function",
          const: true,
          haveEndingEllipsis: false,
          parameters: [
            {
              type: "declarator",
              functionSpecifier: null,
              storageSpecifier: null,
              identifier: "a",
              typename: {
                type: "arithmetic",
                arithmeticType: "char",
                const: false,
                signedUnsigned: null,
              },
            },
            {
              type: "declarator",
              functionSpecifier: null,
              storageSpecifier: null,
              identifier: "b",
              typename: {
                type: "arithmetic",
                arithmeticType: "char",
                const: false,
                signedUnsigned: null,
              },
            },
          ],
          returnType: {
            type: "pointer",
            const: false,
            pointsTo: {
              type: "arithmetic",
              arithmeticType: "int",
              const: false,
              signedUnsigned: null,
            },
          },
        },
      },
      body: [],
      declaredVariables: [],
    },
  ]);

  checkExternalDeclaration("int x;", [
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
    },
  ]);

  checkExternalDeclaration("int x, *p;", [
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
    },
    {
      type: "declarator",
      functionSpecifier: null,
      storageSpecifier: null,
      identifier: "p",
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
    },
  ]);

  checkExternalDeclaration("void kek() { if(2+3) { 3; } else {4; } }", [
    {
      type: "function-declaration",
      declaration: {
        type: "declarator",
        functionSpecifier: null,
        storageSpecifier: null,
        identifier: "kek",
        typename: {
          type: "function",
          const: true,
          haveEndingEllipsis: false,
          parameters: [],
          returnType: { type: "void", const: false },
        },
      },
      body: [
        {
          type: "if",
          condition: {
            type: "binary operator",
            operator: "+",
            left: { type: "const", subtype: "int", value: 2 },
            right: { type: "const", subtype: "int", value: 3 },
          },
          iftrue: {
            type: "compound-statement",
            body: [{ type: "const", subtype: "int", value: 3 }],
          },
          iffalse: {
            type: "compound-statement",
            body: [{ type: "const", subtype: "int", value: 4 }],
          },
        },
      ],
      declaredVariables: [],
    },
  ]);
});
