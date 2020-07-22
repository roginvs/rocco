import { Scanner } from "./scanner";
import {
  SimpleType,
  SIMPLE_TYPE_KEYWORDS,
  Operator,
  Punctuator,
  BinaryOperator,
} from "./scanner.func";
import { match } from "assert";

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
        typename?: TypeNameNode;
      };
    };

export type CastExpressionNode =
  | UnaryExpressionNode
  | {
      type: "typecast";
      typename: TypeNameNode;
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
export type TypeNameNode =
  | IdentifierNode
  | {
      type: "simple type";
      typename: SimpleType;
    };

// @TODO
export type AssignmentExpressionNode = unknown;

// @TODO: Update me
export type ExpressionNode = ConditionalExpressionNode;

const MAX_BINARY_OP_INDEX = 10;

function isPuncBinaryOperatorAtPrioLevel(
  prioLevel: number,
  op: Operator | Punctuator
): BinaryOperator | undefined {
  function check(...binaryOps: BinaryOperator[]): BinaryOperator | undefined {
    const binaryOp = binaryOps.find((x) => x === op);
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

export function createParser(scanner: Scanner) {
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
    } else if (token.type === "punc" && token.value === "(") {
      scanner.readNext();
      const expression = readExpression();
      const closing = scanner.current();
      if (closing.type !== "punc" || closing.value !== ")") {
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
      if (token.type === "punc" && token.value === "[") {
        scanner.readNext();
        const expression = readExpression();
        if (!expression) {
          throwError("Expected expression");
        }
        const closing = scanner.current();
        if (closing.type !== "punc" || closing.value !== "]") {
          throwError("Expected ]");
        }
        scanner.readNext();
        const newLeft: PostfixExpressionNode = {
          type: "subscript operator",
          target: left,
          index: expression,
        };
        left = newLeft;
      } else if (token.type === "punc" && token.value === "(") {
        scanner.readNext();
        const args = readArgumentExpressionList();
        const closing = scanner.current();
        if (closing.type !== "punc" || closing.value !== ")") {
          throwError("Postfix-expression expected ) ");
        }
        scanner.readNext();
        const newLeft: PostfixExpressionNode = {
          type: "function call",
          target: left,
          args,
        };
        left = newLeft;
      } else if (
        token.type === "punc" &&
        (token.value === "." || token.value === "->")
      ) {
        scanner.readNext();
        const identifierToken = scanner.current();
        if (identifierToken.type !== "identifier") {
          throwError("Expected identifier");
        }
        scanner.readNext();
        const newLeft: PostfixExpressionNode = {
          type: token.value === "." ? "struct access" : "struct pointer access",
          field: {
            type: "identifier",
            value: identifierToken.text,
          },
          target: left,
        };
        left = newLeft;
      } else if (token.type === "punc" && token.value === "++") {
        scanner.readNext();
        const newLeft: PostfixExpressionNode = {
          type: "postfix ++",
          target: left,
        };
        left = newLeft;
      } else if (token.type === "punc" && token.value === "--") {
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

    const unaryOperator = UNARY_OPERATORS.find(
      (op) => token.type === "punc" && op === token.value
    );

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
    } else if (
      token.type === "punc" &&
      (token.value === "++" || token.value === "--")
    ) {
      scanner.readNext();
      const right = readUnaryExpression();
      if (!right) {
        throwError("Expecting postfix-expression or unary-expression");
      }
      return {
        type: token.value === "++" ? "prefix ++" : "prefix --",
        target: right,
      };
    } else if (token.type === "keyword" && token.keyword === "sizeof") {
      scanner.readNext();

      // This is quite hacky implementation
      // Expections should be exceptional

      // @TODO: Check type-name grammar

      let unaryExpressionNode: ExpressionNode | undefined;
      scanner.makeControlPoint();
      try {
        unaryExpressionNode = readUnaryExpression();
      } catch (e) {
        // do nothing
      }
      scanner.rollbackControlPoint();

      let typenameNode: TypeNameNode | undefined = undefined;
      scanner.makeControlPoint();
      try {
        const token = scanner.current();
        if (token.type === "punc" && token.value === "(") {
          scanner.readNext();
          typenameNode = readTypeName();
          const closing = scanner.current();
          if (closing.type !== "punc" || closing.value !== ")") {
            throwError("Unary-expression expected )");
          }
          scanner.readNext();
        }
      } catch (e) {
        // do nothing
      }
      scanner.rollbackControlPoint();

      // Here is a trick for forward
      if (unaryExpressionNode) {
        readUnaryExpression();
      } else if (typenameNode) {
        scanner.readNext();
        readTypeName();
        scanner.readNext();
      } else {
        throwError("Expecting unary-expression or type-name");
      }
      return {
        type: "sizeof",
        target: {
          expression: unaryExpressionNode,
          typename: typenameNode,
        },
      };
    } else {
      const postfixExpression = readPostfixExpression();
      return postfixExpression;
    }
  }

  function readCastExpression(): ExpressionNode | undefined {
    // Also hacky, and copy-pasted from readUnaryExpression
    const token = scanner.current();

    if (token.type !== "punc" || token.value !== "(") {
      const unaryExpression = readUnaryExpression();
      return unaryExpression;
    }

    let unaryExpressionNode: ExpressionNode | undefined;
    scanner.makeControlPoint();
    try {
      unaryExpressionNode = readUnaryExpression();
    } catch (e) {
      // do nothing
    }
    scanner.rollbackControlPoint();

    let typenameNode: TypeNameNode | undefined = undefined;
    scanner.makeControlPoint();
    try {
      const token = scanner.current();
      if (token.type === "punc" && token.value === "(") {
        scanner.readNext();
        typenameNode = readTypeName();
        const closing = scanner.current();
        if (closing.type !== "punc" || closing.value !== ")") {
          throwError("Unary-expression expected )");
        }
        scanner.readNext();
      }
    } catch (e) {
      // do nothing
    }
    scanner.rollbackControlPoint();

    // Here is a trick for forward
    // Well, I assume that unary-expression and type-name will consume same amount of tokens
    // Maybe I am wrong
    if (unaryExpressionNode) {
      readUnaryExpression();
    } else if (typenameNode) {
      scanner.readNext();
      readTypeName();
      scanner.readNext();
    } else {
      return undefined;
    }

    const rightNode = readCastExpression();
    if (!rightNode) {
      // We are the last in the chain, so it is unary-expression
      if (!unaryExpressionNode) {
        throwError("Expecting cast-expression");
      }
      return unaryExpressionNode;
    } else {
      if (!typenameNode) {
        throwError("Expecting type");
      }
      return {
        type: "typecast",
        target: rightNode,
        typename: typenameNode,
      };
    }
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
        if (token.type !== "punc") {
          return left;
        }
        const binaryOperator = isPuncBinaryOperatorAtPrioLevel(
          currentPriority,
          token.value
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
    if (questionToken.type === "punc" && questionToken.value === "?") {
      scanner.readNext();
      const iftrue = readExpression();
      if (!iftrue) {
        throwError(`Expecting expression`);
      }
      const colonToken = scanner.current();
      if (colonToken.type !== "punc" || colonToken.value !== ":") {
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

  function readTypeName(): TypeNameNode | undefined {
    // @TODO
    const token = scanner.current();

    const simpleType = SIMPLE_TYPE_KEYWORDS.find(
      (x) => token.type === "keyword" && x === token.keyword
    );
    if (simpleType) {
      scanner.readNext();
      return {
        type: "simple type",
        typename: simpleType,
      };
    } else if (token.type === "identifier") {
      scanner.readNext();
      return {
        type: "identifier",
        value: token.text,
      };
    }
    return undefined;
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
