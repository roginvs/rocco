import { DeepPartial } from "./utils";
import { ExternalDeclaration, NodeLocator } from "./parser.definitions";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { createParser } from "./parser";
import { SymbolTable } from "./parser.symboltable";

// TODO: Remove DeepPartial
function checkExternalDeclaration(
  str: string,
  ast?: DeepPartial<ExternalDeclaration>
) {
  it(`Reads '${str}'`, () => {
    const scanner = new Scanner(createScannerFunc(str));
    const locator: NodeLocator = new Map();

    const parser = createParser(scanner, locator, new SymbolTable(locator));
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
});
