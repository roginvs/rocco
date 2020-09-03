export interface TokenLocation {
  readonly pos: number;
  readonly line: number;
  readonly length: number;
}
export class ScannerError extends Error {
  constructor(str: string, public readonly location: TokenLocation) {
    super(str);
  }
}

export class ParserError extends Error {
  constructor(str: string, public readonly location: TokenLocation) {
    super(str);
  }
}

/** TODO: Emit errors, do not throw */
export class CheckerError extends Error {
  constructor(str: string, public readonly location: TokenLocation) {
    super(str);
  }
}

export class SymbolTableError extends Error {
  constructor(str: string, public readonly location: TokenLocation) {
    super(str);
  }
}
