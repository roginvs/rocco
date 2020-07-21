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
      target: PostfixExpressionNode;
      index: ExpressionNode;
    }
  | {
      type: "function call";
      target: PostfixExpressionNode;
      args: AssignmentExpressionNode[];
    }
  | {
      type: "struct access";
      target: PostfixExpressionNode;
      field: IdentifierNode;
    }
  | {
      type: "struct pointer access";
      target: PostfixExpressionNode;
      field: IdentifierNode;
    }
  | {
      type: "postfix ++";
      target: PostfixExpressionNode;
    }
  | {
      type: "postfix --";
      target: PostfixExpressionNode;
    };

// @TODO
export type AssignmentExpressionNode = unknown;

// @TODO: Update me
export type ExpressionNode = PostfixExpressionNode;

export function createParser(scanner: Scanner) {
  function parseError(info: string): never {
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
        parseError("Expecting closing brace");
      }
      scanner.readNext();
      return expression;
    }
  }

  function readPostfixExpression(): PostfixExpressionNode {
    let left: PostfixExpressionNode | undefined = readPrimaryExpression();
    if (!left) {
      return undefined;
    }
    while (true) {
      const token = scanner.current();
      if (token.type === "punc" && token.value === "[") {
        scanner.readNext();
        const expression = readExpression();
        if (!expression) {
          parseError("Expected expression");
        }
        const closing = scanner.current();
        if (closing.type !== "punc" || closing.value !== "]") {
          parseError("Expected ]");
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
          parseError("Expected )");
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
          parseError("Expected identifier");
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
        // @TODO other productions
        break;
      }
    }
    return left;
  }

  function readArgumentExpressionList() {
    return [] as AssignmentExpressionNode[];
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
