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

export type Token = (
  | {
      type: "keyword";
      keyword: Keyword;
    }
  | {
      type: "identifier";
      text: string;
    }
  | {
      type: "const";
      subtype: "int" | "float" | "char";
      value: number;
    }
  | {
      type: "string-literal";
      value: string;
    }
  | {
      type: "punc";
      value: Operator | Punctuator;
    }
  | {
      type: "end";
    }
) & { pos: number; line: number; length: number };

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
  function savedLocation() {
    return {
      pos: savedInlinePos,
      line: savedLineNumber,
      length: pos - savedPos,
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
        type: "keyword",
        keyword,
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
        type: "const",
        ...savedLocation(),
        subtype: "float",
        value: parseFloat(value),
      };
    } else {
      return {
        type: "const",
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
    incPos();
    if (current() !== "'") {
      throwError("Failed to parse char");
    }
    incPos();
    return {
      type: "const",
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
              if (sliceFromSavedPoint() !== lastRoundExactLengthCandidates[0]) {
                throwError("Internal error");
              }
              return {
                type: "punc",
                ...savedLocation(),
                value: lastRoundExactLengthCandidates[0],
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
          type: "punc",
          ...savedLocation(),
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
