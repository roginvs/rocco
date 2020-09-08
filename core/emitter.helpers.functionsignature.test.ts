import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { NodeLocator } from "./parser.definitions";
import { SymbolTable } from "./parser.symboltable";
import { createParser } from "./parser.funcs";
import { generateFunctionWaTypeName } from "./emitter.helpers.functionsignature";

function parseTypename(str: string) {
  const scanner = new Scanner(createScannerFunc(str));
  const locator: NodeLocator = new Map();

  const symbolTable = new SymbolTable(locator);
  const parser = createParser(scanner, locator, symbolTable);
  symbolTable.enterScope();

  const node = parser.readDeclaration();

  if (node.length !== 1) {
    throw new Error("Must be 1 node");
  }

  expect(scanner.current().type).toBe("end");

  return node[0];
}

function describeTypename(
  str: string,
  waTypeName: string,
  waTypeDefinition: string
) {
  describe(str, () => {
    const node = parseTypename(str);

    if (node.typename.type !== "function") {
      throw new Error("Expecting function type");
    }
    const [
      waTypeNameObserved,
      waTypeDefinitionObserved,
    ] = generateFunctionWaTypeName(node.typename);

    it(waTypeName, () => expect(waTypeNameObserved).toBe(waTypeName));
    it(waTypeDefinition, () =>
      expect(waTypeDefinitionObserved).toBe(waTypeDefinition)
    );
  });
}

describe("generateFunctionWaTypeName", () => {
  describeTypename(`void f();`, "$FUNCSIGv", "(func)");

  describeTypename(
    `void f(int t, double kkk);`,
    "$FUNCSIGvid",
    "(func (param i32 f64))"
  );

  describeTypename(`int f();`, "$FUNCSIGi", "(func (result i32))");

  describeTypename(
    `int f(float i,char c, float j, double n, char*p);`,
    "$FUNCSIGififdi",
    "(func (param f32 i32 f32 f64 i32) (result i32))"
  );
});
