import { createScanner, Token } from "./scanner.func";

export class Scanner {
  private scan: () => Token;

  private currentToken: Token;
  constructor(private scanner: () => Token) {
    this.currentToken = this.scanner();
  }

  current() {
    return this.currentToken;
  }

  readNext() {
    this.currentToken = this.scanner();
  }
}
