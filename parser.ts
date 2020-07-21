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
      args: ArgumentExpressionNode[];
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
export type ArgumentExpressionNode = unknown;

// @TODO: Update me
export type ExpressionNode = PostfixExpressionNode;

export function createParser(scanner: Scanner) {
  function parseError(info: string): never {
    throw new Error(
      `${info} at line=${scanner.current().line} pos=${scanner.current().pos}`
    );
  }

  function readPrimaryExpression(): PrimaryExpressionNode | undefined {
    const token = scanner.current();
    if (token.type === "identifier") {
      scanner.readNext();
      return {
        type: "identifier",
        value: token.text,
      };
    } else if (token.type === "const") {
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
        scanner.readNext();
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
      } else {
        // @TODO other productions
        break;
      }
    }
    return left;
  }

  function readExpression() {
    // @todo
    return readPrimaryExpression();
  }

  return {
    readPrimaryExpression,
    readPostfixExpression,
  };
}
