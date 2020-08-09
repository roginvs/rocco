import { IdentifierNode, Typename } from "./parser.definitions";
import { StorageClass } from "./scanner.func";

export interface SymbolTableEntry {
  identifier: string;
  storage: StorageClass;
  typename: Typename;
}

export class SymbolTable {
  enterScope() {
    // TODO
  }

  addEntry(identifier: string, storage: StorageClass, typename: Typename) {
    // TODO
  }

  /** Returns collected entries for current scope */
  leaveScope(): SymbolTableEntry[] {
    return [];
    // TODO: Return collected
  }

  whatTypeIsIt(identifier: string): SymbolTableEntry | undefined {
    return undefined;
  }
}
