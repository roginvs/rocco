export const OPERATORS = [
  ,
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
  "sizeof",
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

export const KEYWORDS = [
  ,
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
      line: number;
      start: number;
      keyword: Keyword;
    }
  | {
      type: "identifier";
      line: number;
      start: number;
      text: string;
    }
  | {
      type: "const";
      line: number;
      start: number;
      subtype: "int" | "float" | "char";
      value: number;
    }
  | {
      type: "string-literal";
      line: number;
      start: number;
      value: string;
    }
  | {
      type: "punctuator";
      line: number;
      start: number;
      value: Operator | "{" | "}" | "=" | ";";
    };

export function createScanner(str: string) {
  let pos = 0;
  const end = str.length;

  function isWhitespace(char: string) {
    return char === " " || char === "\n" || char === "\r" || char === "\t";
  }

  function scanWhitespace() {
    const start = pos;
    while (pos < end && isWhitespace(str[pos])) {
      pos++;
    }
  }

  function isDigit(char: string) {
    return char.length === 1 && "0123456789".indexOf(char) > -1;
  }
}
