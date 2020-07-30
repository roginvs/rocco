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

export const BINARY_OPERATORS = [
  "*",
  "/",
  "%",
  "+",
  "-",
  "<<",
  ">>",
  "<",
  ">",
  "<=",
  ">=",
  "==",
  "!=",
  "&",
  "^",
  "|",
  "&&",
  "||",
] as const;
export type BinaryOperator = typeof BINARY_OPERATORS[number];

export const ASSIGNMENT_OPERATORS = [
  "=",
  "*=",
  "/=",
  "%=",
  "+=",
  "-=",
  "<<=",
  ">>=",
  "&=",
  "^=",
  "|=",
] as const;

export type AssignmentOperator = typeof ASSIGNMENT_OPERATORS[number];

export const PUNCTUATORS = [
  ...BINARY_OPERATORS,
  ...ASSIGNMENT_OPERATORS,

  "[",
  "]",
  "(",
  ")",
  ".",
  "->",
  "++",
  "--",

  "~",
  "!",

  "?",
  ":",

  ",",
  "{",
  "}",
  ";",
] as const;

export type Punctuator = typeof PUNCTUATORS[number];

if (
  PUNCTUATORS.filter((op1, idx1) =>
    PUNCTUATORS.find((op2, idx2) => op1 === op2 && idx1 !== idx2)
  ).length > 0
) {
  throw new Error("Duplicates found");
}

export const ARITHMETIC_TYPE = [
  "char",
  "short",
  "int",
  "long",
  "float",
  "double",
  "_Bool",
  "_Complex",
] as const;
export type ArithmeticType = typeof ARITHMETIC_TYPE[number];

export const TYPE_SIGNED_UNSIGNED = ["signed", "unsigned"] as const;
export type TypeSignedUnsigned = typeof TYPE_SIGNED_UNSIGNED[number];

export const TYPE_QUALIFIERS = ["restrict", "const", "volatile"] as const;

export type TypeQualifier = typeof TYPE_QUALIFIERS[number];

export const KEYWORDS = [
  ...ARITHMETIC_TYPE,
  ...TYPE_SIGNED_UNSIGNED,
  ...TYPE_QUALIFIERS,
  "auto",

  "break",
  "case",

  "continue",
  "default",
  "do",

  "else",
  "enum",
  "extern",
  "for",
  "goto",
  "if",

  "register",
  "return",

  "sizeof",
  "static",

  "struct",
  "switch",
  "typedef",
  "union",

  "void",
  "while",
] as const;
export type Keyword = typeof KEYWORDS[number];

export type Token = (
  | {
      type: Keyword;
    }
  | {
      type: "identifier";
      text: string;
    }
  | {
      type: "const-expression";
      subtype: "int" | "float" | "char";
      value: number;
    }
  | {
      type: "string-literal";
      value: string;
    }
  | {
      type: Punctuator;
    }
  | {
      type: "end";
    }
) &
  TokenLocation;

export function createScannerFunc(str: string) {
  let pos = 0;
  const end = str.length;

  function current(): string | undefined {
    return str[pos];
  }
  function lookAhead(charCount: number) {
    return pos + charCount < end ? str[pos + charCount] : undefined;
  }
  function next() {
    return lookAhead(1);
  }
  let lineNumber = 1;
  let inlinePos = 1;
  function incPos(n = 1) {
    for (let i = 0; i < n; i++) {
      // TODO: update linenum and pos in line
      if (current() === "\n") {
        lineNumber += 1;
        inlinePos = 1;
      } else {
        inlinePos++;
      }
      pos++;
    }
  }

  let savedPos = pos;
  let savedInlinePos = inlinePos;
  let savedLineNumber = lineNumber;
  function saveLocation() {
    savedPos = pos;
    savedInlinePos = inlinePos;
    savedLineNumber = lineNumber;
  }
  function sliceFromSavedPoint() {
    return str.slice(savedPos, pos);
  }
  function savedLocation(): TokenLocation {
    return {
      pos: savedInlinePos,
      line: savedLineNumber,
      length: pos - savedPos,
    };
  }

  function isWhitespace(char: string | undefined) {
    return char === " " || char === "\n" || char === "\r" || char === "\t";
  }

  function throwError(text: string): never {
    throw new ScannerError(`${text}`, savedLocation());
  }

  function scanWhitespace() {
    while (pos < end && isWhitespace(current())) {
      incPos();
    }
    if (current() === "/" && next() === "*") {
      incPos(2);
      while (true) {
        if (current() === "*" && next() === "/") {
          incPos(2);
          break;
        }
        incPos();
      }
      scanWhitespace();
    }

    if (current() === "/" && next() == "/") {
      incPos(2);
      while (current() !== "\n") {
        incPos();
      }
      scanWhitespace();
    }
  }

  function isDigit(char: string | undefined) {
    return (
      char !== undefined && char.length === 1 && "0123456789".indexOf(char) > -1
    );
  }

  function isLetter(char: string | undefined) {
    return (
      char !== undefined &&
      char.length === 1 &&
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_".indexOf(char) > -1
    );
  }

  function scanIdentifierOrKeyword(): Token {
    saveLocation();
    // We expect that initial symbol is letter
    while (isDigit(current()) || isLetter(current())) {
      incPos();
    }
    const value = sliceFromSavedPoint();
    if (value.length === 0) {
      throwError("Unexpected state");
    }
    const keyword = KEYWORDS.find((x) => x === value);
    if (keyword) {
      return {
        type: keyword,
        ...savedLocation(),
      };
    } else {
      return {
        type: "identifier",
        ...savedLocation(),
        text: value,
      };
    }
  }

  function scanNumber(): Token {
    saveLocation();
    let dotSeen = false;
    while (true) {
      if (current() === ".") {
        if (!dotSeen) {
          dotSeen = true;
          incPos();
        } else {
          break;
        }
      } else if (isDigit(current())) {
        incPos();
      } else {
        break;
      }
    }
    const value = sliceFromSavedPoint();
    if (dotSeen) {
      return {
        type: "const-expression",
        ...savedLocation(),
        subtype: "float",
        value: parseFloat(value),
      };
    } else {
      return {
        type: "const-expression",
        ...savedLocation(),
        subtype: "int",
        value: parseInt(value),
      };
    }
  }

  function scanChar(): Token {
    saveLocation();
    incPos();
    const char = current();
    if (!char) {
      throwError("Failed to parse char, no char");
    }
    incPos();
    if (current() !== "'") {
      throwError("Failed to parse char, expecting closing '");
    }
    incPos();
    return {
      type: "const-expression",
      ...savedLocation(),
      subtype: "char",
      value: char.charCodeAt(0),
    };
  }

  function scanString(): Token {
    saveLocation();
    incPos();
    while (current() !== '"') {
      incPos();
    }
    incPos();
    const value = sliceFromSavedPoint().slice(1, -1);
    return {
      type: "string-literal",
      ...savedLocation(),
      value,
    };
  }

  function scanOperatorOrPunc(): Token | null {
    saveLocation();
    // Oh-la-la! Complicated and tricky!
    let currentOpOrPuncPos = 0;
    let opOrPuncCandidates = [...PUNCTUATORS];
    while (true) {
      const lastRoundCandidates = [...opOrPuncCandidates];
      opOrPuncCandidates = opOrPuncCandidates.filter(
        (op) =>
          op[currentOpOrPuncPos] &&
          op[currentOpOrPuncPos] === lookAhead(currentOpOrPuncPos)
      );
      if (opOrPuncCandidates.length === 0) {
        if (currentOpOrPuncPos > 0) {
          // we must have lastRoundCandidates
          if (lastRoundCandidates.length === 0) {
            throwError("Internal error");
          } else {
            const lastRoundExactLengthCandidates = lastRoundCandidates.filter(
              (op) => op.length === currentOpOrPuncPos
            );
            if (lastRoundExactLengthCandidates.length === 1) {
              incPos(currentOpOrPuncPos);
              if (sliceFromSavedPoint() !== lastRoundExactLengthCandidates[0]) {
                throwError("Internal error");
              }
              return {
                type: lastRoundExactLengthCandidates[0],
                ...savedLocation(),
              };
            }
          }
        }
        return null;
      }

      if (opOrPuncCandidates.length === 1) {
        incPos(currentOpOrPuncPos + 1);
        if (sliceFromSavedPoint() !== opOrPuncCandidates[0]) {
          throwError("Internal error");
        }
        return {
          type: opOrPuncCandidates[0],
          ...savedLocation(),
        };
      }

      currentOpOrPuncPos++;
    }
  }

  function scan(): Token {
    scanWhitespace();

    if (pos >= end) {
      return {
        type: "end",
        ...savedLocation(),
      };
    }

    if (isLetter(current())) {
      return scanIdentifierOrKeyword();
    }

    if (isDigit(current())) {
      return scanNumber();
    }

    if (current() === "'") {
      return scanChar();
    }
    if (current() === '"') {
      return scanString();
    }

    const possibleOpOrPunc = scanOperatorOrPunc();
    if (possibleOpOrPunc) {
      return possibleOpOrPunc;
    }

    throwError("Unknown symbols");
  }

  return scan;
}
