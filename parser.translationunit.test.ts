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

  checkExternalDeclaration("int x, *p;");

  checkExternalDeclaration(
    `
   void kek(int x) { 
      int y;
      if (x > 0) { 
         y = 3;
       } else {
         y = 5;
       };

       while (x > 0){
         x--;
         y = y+1;
       }
     }`,

    [
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
              },
            ],
            returnType: { type: "void", const: false },
          },
        },
        body: [
          {
            type: "declarator",
            functionSpecifier: null,
            storageSpecifier: null,
            identifier: "y",
            typename: {
              type: "arithmetic",
              arithmeticType: "int",
              const: false,
              signedUnsigned: null,
            },
          },
          {
            type: "if",
            condition: {
              type: "binary operator",
              operator: ">",
              left: { type: "identifier", value: "x" },
              right: { type: "const", subtype: "int", value: 0 },
            },
            iftrue: {
              type: "compound-statement",
              body: [
                {
                  type: "assignment",
                  operator: "=",
                  lvalue: { type: "identifier", value: "y" },
                  rvalue: { type: "const", subtype: "int", value: 3 },
                },
              ],
            },
            iffalse: {
              type: "compound-statement",
              body: [
                {
                  type: "assignment",
                  operator: "=",
                  lvalue: { type: "identifier", value: "y" },
                  rvalue: { type: "const", subtype: "int", value: 5 },
                },
              ],
            },
          },
          { type: "const", subtype: "char", value: 0 },
          {
            type: "while",
            condition: {
              type: "binary operator",
              operator: ">",
              left: { type: "identifier", value: "x" },
              right: { type: "const", subtype: "int", value: 0 },
            },
            body: {
              type: "compound-statement",
              body: [
                {
                  type: "postfix --",
                  target: { type: "identifier", value: "x" },
                },
                {
                  type: "assignment",
                  operator: "=",
                  lvalue: { type: "identifier", value: "y" },
                  rvalue: {
                    type: "binary operator",
                    operator: "+",
                    left: { type: "identifier", value: "y" },
                    right: { type: "const", subtype: "int", value: 1 },
                  },
                },
              ],
            },
          },
        ],
        declaredVariables: [
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
            identifier: "y",
            typename: {
              type: "arithmetic",
              arithmeticType: "int",
              const: false,
              signedUnsigned: null,
            },
          },
        ],
      },
    ]
  );
});
