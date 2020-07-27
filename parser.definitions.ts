import {
  BinaryOperator,
  ArithmeticType,
  TypeSignedUnsigned,
} from "./scanner.func";

//
// ============= Expressions =============
//

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

//
// ============= Types =============
//

export type Typename =
  | { type: "void" }
  | {
      type: "arithmetic";
      arithmeticType: ArithmeticType;
      signedUnsigned?: TypeSignedUnsigned;
      const?: boolean;
    }
  | {
      type: "struct";
      const?: boolean;
      // @TODO
    }
  | {
      type: "enum";
      const?: boolean;
      // @TODO
    }
  | {
      type: "pointer";
      const?: boolean;
      pointsTo: Typename;
    }
  | {
      type: "array";
      elementsTypename: Typename;
      size?: ExpressionNode;
    };
