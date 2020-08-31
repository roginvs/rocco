import { DeepPartial } from "./utils";
import { ExternalDeclarations, NodeLocator } from "./parser.definitions";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { createParser } from "./parser";
import { SymbolTable } from "./parser.symboltable";
import { testSnapshot } from "./testsnapshot";

// TODO: Remove DeepPartial
function checkExternalDeclaration(str: string) {
  it(`Reads '${str}'`, () => {
    const scanner = new Scanner(createScannerFunc(str));
    const locator: NodeLocator = new Map();
    const symbolTable = new SymbolTable(locator);
    const parser = createParser(scanner, locator, symbolTable);
    symbolTable.enterScope();
    const node = parser.readExternalDeclaration();
    testSnapshot("translationunit", str, node);

    expect(scanner.current().type).toBe("end");
  });
}

function checkCompoundStatementBody(str: string) {
  it(`Reads '${str}'`, () => {
    const scanner = new Scanner(createScannerFunc(str));
    const locator: NodeLocator = new Map();
    const symbolTable = new SymbolTable(locator);
    const parser = createParser(scanner, locator, symbolTable);
    symbolTable.enterScope();
    symbolTable.enterFunctionScope();
    const node = parser.readCompoundStatementBody();
    testSnapshot("translationunit", str, node);

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
  checkExternalDeclaration("inline int f() {}");
  checkExternalDeclaration("int* f(char a, char b) {}");

  checkExternalDeclaration("int x;");

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
     }`
  );

  checkCompoundStatementBody("for(int i; i < 10; i++) 2;");

  checkCompoundStatementBody("for (;;) {} for(2+3;4;){}");

  checkCompoundStatementBody("void f();  do f(); while(2);");

  checkCompoundStatementBody("for (;;) { continue; break; return; return 2;}");
});
