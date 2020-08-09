import {
  IdentifierNode,
  Typename,
  DeclaratorNode,
  NodeLocator,
} from "./parser.definitions";
import { StorageClass } from "./scanner.func";
import { SymbolTableError } from "./error";

export type IdentifierToTypename = Map<IdentifierNode, DeclaratorNode>;

export class SymbolTable {
  constructor(private readonly locator: NodeLocator) {
    // nothing here
  }

  private readonly externAndStaticDeclarations: DeclaratorNode[] = [];
  private readonly autoInFunctionDeclarations: DeclaratorNode[] = [];

  private readonly declarations: DeclaratorNode[][] = [];

  enterScope() {
    this.declarations.push([]);
  }

  enterFunctionScope() {
    this.enterScope();
    this.autoInFunctionDeclarations.splice(
      0,
      this.autoInFunctionDeclarations.length
    );
  }

  addEntry(declaration: DeclaratorNode) {
    const currentScope = this.declarations[this.declarations.length - 1];
    if (
      currentScope.find(
        (declarationInCurrentScope) =>
          declarationInCurrentScope.identifier === declaration.identifier
      )
    ) {
      const declaratorLocation = this.locator.get(declaration);
      if (!declaratorLocation) {
        throw new Error(
          `Duplicate declaration ${declaration.identifier} and not able to find location`
        );
      }
      throw new SymbolTableError(
        `Duplicate declaration ${declaration.identifier}`,
        declaratorLocation
      );
    }
    currentScope.push(declaration);

    if (
      declaration.storageSpecifier === "extern" ||
      declaration.storageSpecifier === "static"
    ) {
      this.externAndStaticDeclarations.push(declaration);
    }
  }

  leaveScope(): void {
    const currentScope = this.declarations.pop();
    if (!currentScope) {
      throw new Error("Unable to leave scope, no scope at all");
    }
  }

  getCurrentScopeDeclarations() {
    const currentScope = this.declarations[this.declarations.length - 1];
    if (!currentScope) {
      throw new Error("No current scope");
    }
    return currentScope;
  }

  getFunctionAutoDeclaration() {
    return this.autoInFunctionDeclarations;
  }

  lookupInScopes(identifier: string): DeclaratorNode | undefined {
    for (const scope of this.declarations.slice().reverse()) {
      for (const declaration of scope) {
        if (declaration.identifier === identifier) {
          return declaration;
        }
      }
    }
    return undefined;
  }

  // @TODO struct/enum/union scopes
  // @TODO label scopes
}
