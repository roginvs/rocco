import {
  ExternalDeclarations,
  NodeLocator,
  TranslationUnit,
} from "./parser.definitions";
import { Scanner } from "./scanner";
import { SymbolTable } from "./parser.symboltable";
import { createParser } from "./parser.funcs";

export function readTranslationUnit(scanner: Scanner) {
  const locator: NodeLocator = new Map();
  const symbolTable = new SymbolTable(locator);
  symbolTable.enterScope();

  const parser = createParser(scanner, locator, symbolTable);

  const body: ExternalDeclarations = [];
  while (scanner.current().type !== "end") {
    if (scanner.current().type === ";") {
      // This is not in standard
      scanner.readNext();
      continue;
    }
    const nodes: ExternalDeclarations = parser.readExternalDeclaration();
    nodes.forEach((node) => body.push(node));
  }

  const declarations = symbolTable.getTranslationUnittDeclarations();

  const declaratorMap = symbolTable.getDeclaratorsMap();

  const translationUnit: TranslationUnit = {
    type: "translation-unit",
    body: body,
    declarations: declarations,
    declaratorMap: () => declaratorMap,
    locationMap: () => locator,
  };
  return translationUnit;
}
