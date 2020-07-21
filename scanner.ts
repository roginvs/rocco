export const OPERATORS = [
  "[",
  "]",
  "(",
  ")",
  ".",
  "->",
  "++",
  "--",
  "&",
  "*",
  "+",
  "-",
  "~",
  "!",
  "/",
  "%",
  "<<",
  ">>",
  "<",
  ">",
  "<=",
  ">=",
  "==",
  "!=",
  "^",
  "|",
  "&&",
  "||",
  "?",
  ":",
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
  ",",
] as const;
export type Operator = typeof OPERATORS[number];

const PUNCTUATORS = ["{", "}", ";"] as const;
export type Punctuator = typeof PUNCTUATORS[number];

const OP_OR_PUNCS = [...OPERATORS, ...PUNCTUATORS] as const;
const OP_OR_PUNCS_MAX_LEN = Math.max(...OP_OR_PUNCS.map((op) => op.length));

export const KEYWORDS = [
  "break",
  "char",
  "continue",
  "float",
  "else",
  "for",
  "if",
  "int",
  "return",
  "sizeof",
  "struct",
  "void",
  "while",
] as const;
export type Keyword = typeof KEYWORDS[number];

export type Token =
  | {
      type: "keyword";
      pos: number;
      line: number;
      keyword: Keyword;
    }
  | {
      type: "identifier";
      pos: number;
      line: number;
      text: string;
    }
  | {
      type: "const";
      pos: number;
      line: number;
      subtype: "int" | "float" | "char";
      value: number;
    }
  | {
      type: "string-literal";
      pos: number;
      line: number;
      value: string;
    }
  | {
      type: "operator_or_punctuator";
      pos: number;
      line: number;
      value: Operator | Punctuator;
    }
  | {
      type: "end";
      pos: number;
      line: number;
    };

export function createScanner(str: string) {
  let pos = 0;
  const end = str.length;

  function current() {
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
  function location() {
    return {
      pos: inlinePos,
      line: lineNumber,
    };
  }

  function isWhitespace(char: string) {
    return char === " " || char === "\n" || char === "\r" || char === "\t";
  }

  function throwError(text: string): never {
    throw new Error(`${text} at ${pos} (line ${lineNumber}, pos ${inlinePos})`);
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

  function isDigit(char: string) {
    return char.length === 1 && "0123456789".indexOf(char) > -1;
  }

  function isLetter(char: string) {
    return (
      char.length === 1 &&
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_".indexOf(char) > -1
    );
  }

  function scanIdentifierOrKeyword(): Token {
    const start = pos;
    // We expect that initial symbol is letter
    while (isDigit(current()) || isLetter(current())) {
      incPos();
    }
    const value = str.slice(start, pos);
    if (value.length === 0) {
      throwError("Unexpected state");
    }
    const keyword = KEYWORDS.find((x) => x === value);
    if (keyword) {
      return {
        type: "keyword",
        keyword,
        ...location(),
      };
    } else {
      return {
        type: "identifier",
        ...location(),
        text: value,
      };
    }
  }

  function scanNumber(): Token {
    const start = pos;
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
    const value = str.slice(start, pos);
    if (dotSeen) {
      return {
        type: "const",
        ...location(),
        subtype: "float",
        value: parseFloat(value),
      };
    } else {
      return {
        type: "const",
        ...location(),
        subtype: "int",
        value: parseInt(value),
      };
    }
  }

  function scanChar(): Token {
    const start = pos;
    incPos();
    const char = current();
    incPos();
    if (current() !== "'") {
      throwError("Failed to parse char");
    }
    incPos();
    return {
      type: "const",
      ...location(),
      subtype: "char",
      value: str.slice(start, start + 1).charCodeAt(0),
    };
  }

  function scanString(): Token {
    const start = pos;
    incPos();
    while (current() !== '"') {
      incPos();
    }
    const value = str.slice(start + 1, pos);
    incPos();
    return {
      type: "string-literal",
      ...location(),
      value,
    };
  }

  function scanOperatorOrPunc(): Token | null {
    const start = pos;
    // Oh-la-la! Complicated and tricky!
    let currentOpOrPuncPos = 0;
    let opOrPuncCandidates = [...OP_OR_PUNCS];
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
              return {
                type: "operator_or_punctuator",
                ...location(),
                value: lastRoundExactLengthCandidates[0],
              };
            }
          }
        }
        return null;
      }

      if (opOrPuncCandidates.length === 1) {
        incPos(currentOpOrPuncPos + 1);
        return {
          type: "operator_or_punctuator",
          ...location(),
          value: opOrPuncCandidates[0],
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
        ...location(),
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

import * as fs from "fs";
const fdata = fs.readFileSync(__dirname + "/C/1.c").toString();
const scanner = createScanner(fdata);
while (true) {
  const token = scanner();
  console.info(token);
  if (token.type === "end") {
    break;
  }
}
