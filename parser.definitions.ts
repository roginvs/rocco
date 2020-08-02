import {
  BinaryOperator,
  ArithmeticType,
  TypeSignedUnsigned,
  AssignmentOperator,
  StorageClass,
} from "./scanner.func";
import { TokenLocation } from "./error";

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
      args: ArgumentExpressionList;
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

// @TODO PostfixExpressionNode:   ( type-name ) { initializer-list }
// @TODO PostfixExpressionNode: ( type-name ) { initializer-list , }

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
      expression: ExpressionNode;
    }
  | {
      type: "sizeof typename";
      typename: Typename;
    };

export type CastExpressionNode =
  | UnaryExpressionNode
  | {
      type: "cast";
      typename: Typename;
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

export type ArgumentExpressionList = ExpressionNode[];

export type AssignmentExpressionNode =
  | ConditionalExpressionNode
  | {
      type: "assignment";
      operator: AssignmentOperator;
      lvalue: ExpressionNode;
      rvalue: ExpressionNode;
    };

export type ExpressionNode =
  | AssignmentExpressionNode
  | {
      type: "expression with sideeffect";
      sizeeffect: ExpressionNode;
      effectiveValue: ExpressionNode;
    };

//
// ============= Types =============
//

export type Typename =
  | { type: "void"; const: boolean }
  | {
      type: "arithmetic";
      arithmeticType: ArithmeticType;
      signedUnsigned: TypeSignedUnsigned | null;
      const: boolean;
    }
  | {
      type: "struct";
      const: boolean;
      // @TODO
    }
  | {
      type: "enum";
      const: boolean;
      // @TODO
    }
  | {
      type: "pointer";
      const: boolean;
      pointsTo: Typename;
    }
  | {
      type: "array";
      elementsTypename: Typename;
      size: ExpressionNode | "*" | null;
      const: true;
    };

export type DeclaratorNode = {
  type: "declarator";
  identifier: string;
  typename: Typename;
  storageSpecifier: StorageClass | null;
  functionSpecifier: "inline" | null;
};

export type NodeLocator = Map<ExpressionNode | Typename, TokenLocation>;
