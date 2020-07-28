import { Scanner } from "./scanner";
import {
  ARITHMETIC_TYPE,
  Punctuator,
  BinaryOperator,
  Token,
  ASSIGNMENT_OPERATORS,
} from "./scanner.func";
import {
  ExpressionNode,
  PostfixExpressionNode,
  AssignmentExpressionNode,
  UNARY_OPERATORS,
  Typename,
} from "./parser.definitions";

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

export interface ExpressionRequirements {
  isCurrentTokenLooksLikeTypeName(): boolean;
  readTypeName(): Typename;
}

export function createExpressionParser(
  scanner: Scanner,
  typeParser: ExpressionRequirements
) {
  function throwError(info: string): never {
    throw new Error(
      `${info} at line=${scanner.current().line} pos=${
        scanner.current().pos
      } tokenType=${scanner.current().type}`
    );
  }

  function readPrimaryExpression(): ExpressionNode {
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
    } else {
      throwError("Expecting primary-expression");
    }
  }

  function readPostfixExpression(): ExpressionNode {
    let left: ExpressionNode = readPrimaryExpression();

    while (true) {
      const token = scanner.current();
      if (token.type === "[") {
        scanner.readNext();
        const expression = readExpression();

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

        const args =
          scanner.current().type !== ")" ? readArgumentExpressionList() : [];

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
    const nodes: ExpressionNode[] = [];
    while (true) {
      const node = readAssignmentExpression();
      nodes.push(node);

      if (scanner.current().type === ",") {
        scanner.readNext();
      } else {
        break;
      }
    }
    return nodes;
  }

  function readUnaryExpression(): ExpressionNode {
    const token = scanner.current();

    const unaryOperator = UNARY_OPERATORS.find((op) => op === token.type);

    if (unaryOperator) {
      scanner.readNext();
      const right = readUnaryExpression();

      return {
        type: "unary-operator",
        operator: unaryOperator,
        target: right,
      };
    } else if (token.type === "++" || token.type === "--") {
      scanner.readNext();
      const right = readUnaryExpression();

      return {
        type: token.type === "++" ? "prefix ++" : "prefix --",
        target: right,
      };
    } else if (token.type === "keyword" && token.keyword === "sizeof") {
      scanner.readNext();

      if (scanner.current().type === "(") {
        scanner.readNext();

        if (typeParser.isCurrentTokenLooksLikeTypeName()) {
          const typename = typeParser.readTypeName();
          if (scanner.current().type !== ")") {
            throwError("Expected )");
          }
          scanner.readNext();
          return {
            type: "sizeof typename",
            typename: typename,
          };
        } else {
          // We could rollback and use "readUnaryExpression", but it does not matter
          const expressionNode = readExpression();

          if (scanner.current().type !== ")") {
            throwError("Expected )");
          }
          scanner.readNext();

          return {
            type: "sizeof expression",
            expression: expressionNode,
          };
        }
      } else {
        const unaryExpressionNode = readUnaryExpression();

        return {
          type: "sizeof expression",
          expression: unaryExpressionNode,
        };
      }
    } else {
      const postfixExpression = readPostfixExpression();
      return postfixExpression;
    }
  }

  function readCastExpression(): ExpressionNode {
    const token = scanner.current();

    if (token.type !== "(") {
      const unaryExpression = readUnaryExpression();
      return unaryExpression;
    }

    scanner.makeControlPoint();

    scanner.readNext();

    if (typeParser.isCurrentTokenLooksLikeTypeName()) {
      scanner.clearControlPoint();
      const typename = typeParser.readTypeName();
      if (scanner.current().type !== ")") {
        throwError("Expected )");
      }
      scanner.readNext();

      const castTarget = readCastExpression();

      return {
        type: "cast",
        typename: typename,
        target: castTarget,
      };
    } else {
      // This means that "(" is not a part of cast-expression, it is a unary-expression
      scanner.rollbackControlPoint();
      const unaryExpression = readUnaryExpression();
      return unaryExpression;
    }
  }

  function readLogicalOrExpression(): ExpressionNode {
    function read(currentPriority: number): ExpressionNode {
      if (currentPriority === 0) {
        return readCastExpression();
      }

      let left = read(currentPriority - 1);

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

  function readConditionalExpression(): ExpressionNode {
    const condition = readLogicalOrExpression();

    const questionToken = scanner.current();
    if (questionToken.type === "?") {
      scanner.readNext();
      const iftrue = readExpression();

      const colonToken = scanner.current();
      if (colonToken.type !== ":") {
        throwError("Expecting colon");
      }
      scanner.readNext();
      const iffalse = readConditionalExpression();

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

  function readAssignmentExpression(): ExpressionNode {
    const conditionExpression = readConditionalExpression();

    const possibleAssignmentOperatorToken = scanner.current();
    const assignmentOperator = ASSIGNMENT_OPERATORS.find(
      (op) => possibleAssignmentOperatorToken.type === op
    );
    if (!assignmentOperator) {
      return conditionExpression;
    }

    // Here we can validate that lvalue expression is actually an lvalue
    // For example, filter out conditional expressions and so on
    // But we will do this on next stage

    scanner.readNext();

    const rvalue = readAssignmentExpression();

    return {
      type: "assignment",
      operator: assignmentOperator,
      lvalue: conditionExpression,
      rvalue: rvalue,
    };
  }

  function readExpression(): ExpressionNode {
    const left = readAssignmentExpression();
    if (scanner.current().type === ",") {
      scanner.readNext();
      const effectiveValue = readExpression();
      return {
        type: "expression with sideeffect",
        sizeeffect: left,
        effectiveValue: effectiveValue,
      };
    } else {
      return left;
    }
  }

  function readConstantExpression() {
    return readConditionalExpression();
  }

  return {
    readExpression,
    readAssignmentExpression,
    readConstantExpression,
  };
}
