import { createScannerFunc, Token } from "./scanner.func";

export class Scanner {
  private currentToken: Token;
  constructor(private scanner: () => Token) {
    this.currentToken = this.scanner();
  }

  current() {
    return this.currentToken;
  }

  private pushedBackTokens: Token[] = [];

  readNext() {
    const pushedBackToken = this.pushedBackTokens.shift();

    const currentToken = pushedBackToken ? pushedBackToken : this.scanner();

    this.controlPoints.forEach((controlPoint) =>
      controlPoint.push(currentToken)
    );
    this.currentToken = currentToken;
  }

  private controlPoints: Token[][] = [];

  public makeControlPoint() {
    this.controlPoints.push([this.currentToken]);
  }
  public clearControlPoint() {
    const dataInControlPoint = this.controlPoints.pop();
    if (!dataInControlPoint) {
      throw new Error(`No saved control point!`);
    }
  }
  public rollbackControlPoint() {
    const dataInControlPoint = this.controlPoints.pop();
    if (!dataInControlPoint) {
      throw new Error(`No saved control point!`);
    }

    // Clear other control points
    this.controlPoints.forEach((controlPoint) => {
      dataInControlPoint.forEach(() => controlPoint.pop());
    });

    dataInControlPoint.forEach((token) => this.pushedBackTokens.push(token));
    this.readNext();
  }
}

/*

  *   *    
a b c d e f g 

*/
