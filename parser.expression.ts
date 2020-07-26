import { Scanner } from "./scanner";
import {
  ARITHMETIC_TYPE,
  Punctuator,
  BinaryOperator,
  Token,
} from "./scanner.func";

export type IdentifierNode = {
  type: "identifier";
  value: string;
};

export type PrimaryExpressionNode =
  | IdentifierNode
  | {
      type: "const";
      subtype: "int" | "float" | "char";
      value: number;
    }
  | {
      type: "string-literal";
      value: string;
    };

export type PostfixExpressionNode =
  | PrimaryExpressionNode
  | {
      type: "subscript operator";
      target: ExpressionNode;
      index: ExpressionNode;
    }
  | {
      type: "function call";
      target: ExpressionNode;
      args: AssignmentExpressionNode[];
    }
  | {
      type: "struct access";
      target: ExpressionNode;
      field: IdentifierNode;
    }
  | {
      type: "struct pointer access";
      target: ExpressionNode;
      field: IdentifierNode;
    }
  | {
      type: "postfix ++";
      target: ExpressionNode;
    }
  | {
      type: "postfix --";
      target: ExpressionNode;
    };

export const UNARY_OPERATORS = ["&", "*", "+", "-", "~", "!"] as const;
export type UnaryOperator = typeof UNARY_OPERATORS[number];

export type UnaryExpressionNode =
  | PostfixExpressionNode
  | {
      type: "prefix --";
      target: ExpressionNode;
    }
  | {
      type: "prefix ++";
      target: ExpressionNode;
    }
  | {
      type: "unary-operator";
      operator: UnaryOperator;
      target: ExpressionNode;
    }
  | {
      type: "sizeof";
      target: {
        expression?: ExpressionNode;
        //  typename?: TypeNameNode;
      };
    };

export type CastExpressionNode =
  | UnaryExpressionNode
  | {
      type: "typecast";
      // typename: TypeNameNode;
      target: ExpressionNode;
    };

export type BinaryOperatorNode =
  | CastExpressionNode
  | {
      type: "binary operator";
      operator: BinaryOperator;
      left: ExpressionNode;
      right: ExpressionNode;
    };

export type ConditionalExpressionNode =
  | BinaryOperatorNode
  | {
      type: "conditional expression";
      condition: ExpressionNode;
      iftrue: ExpressionNode;
      iffalse: ExpressionNode;
    };

// @TODO
export type AssignmentExpressionNode = unknown;

// @TODO: Update me
export type ExpressionNode = ConditionalExpressionNode;

const MAX_BINARY_OP_INDEX = 10;

function isTokenBinaryOperatorAtPrioLevel(
  prioLevel: number,
  token: Token
): BinaryOperator | undefined {
  function check(...binaryOps: BinaryOperator[]): BinaryOperator | undefined {
    const binaryOp = binaryOps.find((x) => x === token.type);
    return binaryOp;
  }
  switch (prioLevel) {
    case 1:
      return check("*", "/", "%");
    case 2:
      return check("+", "-");
    case 3:
      return check("<<", ">>");
    case 4:
      return check("<", ">", "<=", ">=");
    case 5:
      return check("==", "!=");
    case 6:
      return check("&");
    case 7:
      return check("^");
    case 8:
      return check("|");
    case 9:
      return check("&&");
    case 10:
      return check("||");
    default:
      throw new Error(`Unknown prio level`);
  }
}

export function createExpressionParser(scanner: Scanner) {
  function throwError(info: string): never {
    throw new Error(
      `${info} at line=${scanner.current().line} pos=${scanner.current().pos}`
    );
  }

  function readPrimaryExpression(): ExpressionNode | undefined {
    const token = scanner.current();
    if (token.type === "identifier") {
      scanner.readNext();
      return {
        type: "identifier",
        value: token.text,
      };
    } else if (token.type === "const") {
      scanner.readNext();
      return {
        type: "const",
        subtype: token.subtype,
        value: token.value,
      };
    } else if (token.type === "string-literal") {
      scanner.readNext();
      return {
        type: "string-literal",
        value: token.value,
      };
    } else if (token.type === "(") {
      scanner.readNext();
      const expression = readExpression();
      const closing = scanner.current();
      if (closing.type !== ")") {
        throwError("Expecting closing brace");
      }
      scanner.readNext();
      return expression;
    }
  }

  function readPostfixExpression(): ExpressionNode | undefined {
    let left: ExpressionNode | undefined = readPrimaryExpression();
    if (!left) {
      return undefined;
    }
    while (true) {
      const token = scanner.current();
      if (token.type === "[") {
        scanner.readNext();
        const expression = readExpression();
        if (!expression) {
          throwError("Expected expression");
        }
        const closing = scanner.current();
        if (closing.type !== "]") {
          throwError("Expected ]");
        }
        scanner.readNext();
        const newLeft: PostfixExpressionNode = {
          type: "subscript operator",
          target: left,
          index: expression,
        };
        left = newLeft;
      } else if (token.type === "(") {
        scanner.readNext();
        const args = readArgumentExpressionList();
        const closing = scanner.current();
        if (closing.type !== ")") {
          throwError("Postfix-expression expected ) ");
        }
        scanner.readNext();
        const newLeft: PostfixExpressionNode = {
          type: "function call",
          target: left,
          args,
        };
        left = newLeft;
      } else if (token.type === "." || token.type === "->") {
        scanner.readNext();
        const identifierToken = scanner.current();
        if (identifierToken.type !== "identifier") {
          throwError("Expected identifier");
        }
        scanner.readNext();
        const newLeft: PostfixExpressionNode = {
          type: token.type === "." ? "struct access" : "struct pointer access",
          field: {
            type: "identifier",
            value: identifierToken.text,
          },
          target: left,
        };
        left = newLeft;
      } else if (token.type === "++") {
        scanner.readNext();
        const newLeft: PostfixExpressionNode = {
          type: "postfix ++",
          target: left,
        };
        left = newLeft;
      } else if (token.type === "--") {
        scanner.readNext();
        const newLeft: PostfixExpressionNode = {
          type: "postfix --",
          target: left,
        };
        left = newLeft;
      } else {
        break;
      }
    }
    return left;
  }

  function readArgumentExpressionList() {
    const nodes: AssignmentExpressionNode[] = [];
    while (true) {
      const node = readAssignmentExpression();
      if (node) {
        nodes.push(node);
      } else {
        break;
      }
    }
    return nodes;
  }

  function readUnaryExpression(): ExpressionNode | undefined {
    const token = scanner.current();

    const unaryOperator = UNARY_OPERATORS.find((op) => op === token.type);

    if (unaryOperator) {
      scanner.readNext();
      const right = readUnaryExpression();
      if (!right) {
        throwError("Expecting postfix-expression or unary-expression");
      }
      return {
        type: "unary-operator",
        operator: unaryOperator,
        target: right,
      };
    } else if (token.type === "++" || token.type === "--") {
      scanner.readNext();
      const right = readUnaryExpression();
      if (!right) {
        throwError("Expecting postfix-expression or unary-expression");
      }
      return {
        type: token.type === "++" ? "prefix ++" : "prefix --",
        target: right,
      };
    } else if (token.type === "keyword" && token.keyword === "sizeof") {
      scanner.readNext();

      // @TODO: Use isType and read as type

      // Currently it only reads it as expression

      // @TODO: Check type-name grammar

      const unaryExpressionNode = readUnaryExpression();

      return {
        type: "sizeof",
        target: {
          expression: unaryExpressionNode,
          // typename: undefined,
        },
      };
    } else {
      const postfixExpression = readPostfixExpression();
      return postfixExpression;
    }
  }

  function readCastExpression(): ExpressionNode | undefined {
    // Same problems as above
    // @TODO
    const token = scanner.current();

    if (token.type !== "(") {
      const unaryExpression = readUnaryExpression();
      return unaryExpression;
    }

    const unaryExpressionNode = readUnaryExpression();

    return unaryExpressionNode;
  }

  function readLogicalOrExpression(): ExpressionNode | undefined {
    function read(currentPriority: number): ExpressionNode | undefined {
      if (currentPriority === 0) {
        return readCastExpression();
      }

      let left = read(currentPriority - 1);

      if (!left) {
        return undefined;
      }

      while (true) {
        const token = scanner.current();

        const binaryOperator = isTokenBinaryOperatorAtPrioLevel(
          currentPriority,
          token
        );

        if (!binaryOperator) {
          return left;
        }

        scanner.readNext();
        const right = read(currentPriority - 1);
        if (!right) {
          throwError(`Expected expression in binary operator`);
        }
        const newLeft: ExpressionNode = {
          type: "binary operator",
          operator: binaryOperator,
          left,
          right,
        };
        left = newLeft;
      }
    }

    return read(MAX_BINARY_OP_INDEX);
  }

  function readConditionalExpression(): ExpressionNode | undefined {
    const condition = readLogicalOrExpression();
    if (!condition) {
      return undefined;
    }

    const questionToken = scanner.current();
    if (questionToken.type === "?") {
      scanner.readNext();
      const iftrue = readExpression();
      if (!iftrue) {
        throwError(`Expecting expression`);
      }
      const colonToken = scanner.current();
      if (colonToken.type !== ":") {
        throwError("Expecting colon");
      }
      scanner.readNext();
      const iffalse = readConditionalExpression();
      if (!iffalse) {
        throwError("Expecting conditional-expression");
      }
      return {
        type: "conditional expression",
        condition,
        iftrue,
        iffalse,
      };
    } else {
      return condition;
    }
  }

  function readAssignmentExpression(): AssignmentExpressionNode | undefined {
    // @todo
    return undefined;
  }

  function readExpression() {
    // @todo
    return readConditionalExpression();
  }

  return {
    readExpression,
  };
}
