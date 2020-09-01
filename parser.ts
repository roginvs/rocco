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

  const parser = createParser(scanner, locator, symbolTable);

  const body: ExternalDeclarations[] = [];
  while (scanner.current().type !== "end") {
    const node: ExternalDeclarations = parser.readExternalDeclaration();
    body.push(node);
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
