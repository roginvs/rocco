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
      start: number;
      keyword: Keyword;
    }
  | {
      type: "identifier";
      start: number;
      text: string;
    }
  | {
      type: "const";
      start: number;
      subtype: "int" | "float" | "char";
      value: number;
    }
  | {
      type: "string-literal";
      start: number;
      value: string;
    }
  | {
      type: "operator_or_punctuator";
      start: number;
      value: Operator | Punctuator;
    }
  | {
      type: "end";
      start: number;
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

  function isWhitespace(char: string) {
    return char === " " || char === "\n" || char === "\r" || char === "\t";
  }

  function scanError(text: string): never {
    let posInLine = 0;
    let lineNum = 0;
    let i = 0;
    while (i < pos) {
      if (str[i] === "\n") {
        lineNum += 1;
        posInLine = 0;
      } else {
        posInLine++;
      }
      i++;
    }
    throw new Error(
      `${text} at ${pos} (line ${lineNum + 1}, pos ${posInLine + 1})`
    );
  }

  function scanWhitespace() {
    const start = pos;
    while (pos < end && isWhitespace(current())) {
      pos++;
    }
    if (current() === "/" && next() === "*") {
      pos += 2;
      while (true) {
        if (current() === "*" && next() === "/") {
          pos += 2;
          break;
        }
        pos++;
      }
      scanWhitespace();
    }

    if (current() === "/" && next() == "/") {
      pos += 2;
      while (current() !== "\n") {
        pos++;
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
      pos++;
    }
    const value = str.slice(start, pos);
    if (value.length === 0) {
      scanError("Unexpected state");
    }
    const keyword = KEYWORDS.find((x) => x === value);
    if (keyword) {
      return {
        type: "keyword",
        keyword,
        start,
      };
    } else {
      return {
        type: "identifier",
        start,
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
          pos++;
        } else {
          break;
        }
      } else if (isDigit(current())) {
        pos++;
      } else {
        break;
      }
    }
    const value = str.slice(start, pos);
    if (dotSeen) {
      return {
        type: "const",
        start,
        subtype: "float",
        value: parseFloat(value),
      };
    } else {
      return {
        type: "const",
        start,
        subtype: "int",
        value: parseInt(value),
      };
    }
  }

  function scanChar(): Token {
    const start = pos;
    pos++;
    const char = current();
    pos++;
    if (current() !== "'") {
      scanError("Failed to parse char");
    }
    pos++;
    return {
      type: "const",
      start,
      subtype: "char",
      value: str.slice(start, start + 1).charCodeAt(0),
    };
  }

  function scanString(): Token {
    const start = pos;
    pos++;
    while (current() !== '"') {
      pos++;
    }
    const value = str.slice(start + 1, pos);
    pos++;
    return {
      type: "string-literal",
      start: start,
      value,
    };
  }

  function scanOperatorOrPunc(): Token | null {
    const start = pos;
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
            scanError("Internal error");
          } else {
            const lastRoundExactLengthCandidates = lastRoundCandidates.filter(
              (op) => op.length === currentOpOrPuncPos
            );
            if (lastRoundExactLengthCandidates.length === 1) {
              pos += currentOpOrPuncPos;
              return {
                type: "operator_or_punctuator",
                start,
                value: lastRoundExactLengthCandidates[0],
              };
            }
          }
        }
        return null;
      }

      if (opOrPuncCandidates.length === 1) {
        pos += currentOpOrPuncPos + 1;
        return {
          type: "operator_or_punctuator",
          start,
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
        start: pos,
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

    scanError("Unknown symbols");
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
