import { Token } from "./scanner.func";

export class Scanner {
  private currentToken: Token;
  constructor(private readonly scanner: () => Token) {
    this.currentToken = this.scanner();
  }

  current() {
    return this.currentToken;
  }

  private readonly pushedBackTokens: Token[] = [];

  readNext() {
    const pushedBackToken = this.pushedBackTokens.shift();

    const currentToken = pushedBackToken ? pushedBackToken : this.scanner();

    /*
    this.controlPoints.forEach((controlPoint) =>
      controlPoint.push(currentToken)
    );
    */

    this.currentToken = currentToken;
  }

  pushBack(token: Token) {
    this.pushedBackTokens.unshift(this.current());
    this.currentToken = token;
  }

  nextToken() {
    const token = this.current();
    this.readNext();
    const next = this.current();
    this.pushBack(token);
    return next;
  }

  /*
  private readonly controlPoints: Token[][] = [];

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

    dataInControlPoint
      .slice()
      .reverse()
      .forEach((token) => this.pushedBackTokens.unshift(token));
    this.readNext();
  }
  */
}

/*

  *   *    
a b c d e f g 

*/
