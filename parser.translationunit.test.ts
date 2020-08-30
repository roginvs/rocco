import { DeepPartial } from "./utils";
import { ExternalDeclaration, NodeLocator } from "./parser.definitions";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { createTypeParser } from "./parser.typename";
import { createMockedExpressionParser } from "./parser.testutils";
import { SymbolTable } from "./parser.symboltable";

// TODO: Remove DeepPartial
function checkExternalDeclaration(
  str: string,
  ast?: DeepPartial<ExternalDeclaration>
) {
  it(`Reads '${str}'`, () => {
    const scanner = new Scanner(createScannerFunc(str));
    const locator: NodeLocator = new Map();

    const parser = createTypeParser(
      scanner,
      locator,
      createMockedExpressionParser(scanner),
      new SymbolTable(locator)
    );
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

    const parser = createTypeParser(
      scanner,
      locator,
      createMockedExpressionParser(scanner),
      new SymbolTable(locator)
    );
    expect(() => parser.readExternalDeclaration()).toThrow();
  });
}

describe("External declaration functions", () => {
  checkExternalDeclaration("int f() {}");
  checkExternalDeclaration("int* f(char a, char b) {}");
});
