import { Scanner } from "./scanner";

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
      type: "sizeof expression";
      target: ExpressionNode;
    }
  | {
      type: "sizeof type";
      target: TypeNameNode;
    };

export type CastExpressionNode =
  | UnaryExpressionNode
  | {
      type: "typecast";
      cast: TypeNameNode;
      target: ExpressionNode;
    };

// @TODO
export type TypeNameNode = unknown;

// @TODO
export type AssignmentExpressionNode = unknown;

// @TODO: Update me
export type ExpressionNode = CastExpressionNode;

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
      scanner.readNext();
      const closing = scanner.current();
      if (closing.type !== "punc" || closing.value !== ")") {
        throwError("Expecting closing brace");
      }
      scanner.readNext();
      return expression;
    }
  }

  function readPostfixExpression(): ExpressionNode {
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
          throwError("Expected )");
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

  function readAssignmentExpression(): AssignmentExpressionNode | undefined {
    // @todo
    return undefined;
  }

  function readExpression() {
    // @todo
    return readPostfixExpression();
  }

  return {
    readPrimaryExpression,
    readPostfixExpression,
  };
}
