import {
  IdentifierNode,
  Typename,
  DeclaratorNode,
  NodeLocator,
} from "./parser.definitions";

import { SymbolTableError } from "./error";

export type IdentifierToTypename = Map<IdentifierNode, DeclaratorNode>;

export class SymbolTable {
  constructor(private readonly locator: NodeLocator) {
    // nothing here
  }

  /** List of declarations for whole compilaion unit */
  private readonly externAndStaticDeclarations: DeclaratorNode[] = [];
  /** List of declarations inside current function scope */
  private autoInFunctionDeclarations: DeclaratorNode[] | null = null;

  private readonly declarations: DeclaratorNode[][] = [];

  enterScope() {
    this.declarations.push([]);
  }

  enterFunctionScope() {
    this.enterScope();

    if (this.autoInFunctionDeclarations !== null) {
      throw new Error("Internal error: already in function scope");
    }
    this.autoInFunctionDeclarations = [];
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
    } else {
      if (this.autoInFunctionDeclarations) {
        this.autoInFunctionDeclarations.push(declaration);
      }
    }
  }

  getExternAndStaticDeclarations() {
    return this.externAndStaticDeclarations;
  }

  leaveScope(): void {
    const currentScope = this.declarations.pop();
    if (!currentScope) {
      throw new Error("Unable to leave scope, no scope at all");
    }
  }

  leaveFunctionScope() {
    const currentScope = this.declarations.pop();
    if (!currentScope) {
      throw new Error("Unable to leave scope, no scope at all");
    }
    const declaredInFunction = this.autoInFunctionDeclarations;
    this.autoInFunctionDeclarations = null;
    if (declaredInFunction === null) {
      throw new Error(
        "Internal error: unable to leave function scope because did no enter there"
      );
    }
    return declaredInFunction;
  }

  /**
   * ???? Remove this
   */
  getCurrentScopeDeclarations() {
    const currentScope = this.declarations[this.declarations.length - 1];
    if (!currentScope) {
      throw new Error("No current scope");
    }
    return currentScope;
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

  isIdentifierAlreadyDefinedInCurrentScope(identifier: string) {
    const currentScope = this.declarations.slice().pop();
    if (!currentScope) {
      throw new Error("No current scope!");
    }
    for (const declaration of currentScope) {
      if (declaration.identifier === identifier) {
        return true;
      }
    }
    return false;
  }
}
