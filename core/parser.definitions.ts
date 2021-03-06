import {
  BinaryOperator,
  TypeSignedUnsigned,
  AssignmentOperator,
  StorageClass,
} from "./scanner.func";
import { TokenLocation } from "./error";

//
// ============= Expressions =============
//
export type DeclaratorId = string & { readonly _nominal: "declarator id " };

export type IdentifierNode = {
  type: "identifier";
  value: string;
  declaratorNodeId: DeclaratorId;
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
      identifier: string;
    }
  | {
      type: "struct pointer access";
      target: ExpressionNode;
      identifier: string;
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

interface AssignmentExpression {
  type: "assignment";
  operator: AssignmentOperator;
  lvalue: ExpressionNode;
  rvalue: ExpressionNode;
}
export type AssignmentExpressionNode =
  | ConditionalExpressionNode
  | AssignmentExpression;

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

export type ArithmeticType =
  | "char"
  | "short"
  | "int"
  | "long long"
  | "float"
  | "double";

export type FunctionTypename = {
  type: "function";
  parameters: (DeclaratorNode | Typename)[];
  haveEndingEllipsis: boolean;
  returnType: Typename;
  const: true;
};

export type TypenameArithmetic = {
  type: "arithmetic";
  arithmeticType: ArithmeticType;
  signedUnsigned: TypeSignedUnsigned | null;
  const: boolean;
};

export type TypenamePointer = {
  type: "pointer";
  const: boolean;
  pointsTo: Typename;
};

export type TypenameScalar = TypenameArithmetic | TypenamePointer;

export type Typename =
  | TypenameScalar
  | { type: "void"; const: boolean }
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
      type: "array";
      elementsTypename: Typename;
      size: ExpressionNode | "*" | null;
      const: true;
    }
  | FunctionTypename
  | {
      type: "function-knr";
      parametersIdentifiers: IdentifierNode[];
      returnType: Typename;
      const: true;
    };

type DeclaratorNodeGeneric<T extends Typename> = {
  type: "declarator";
  identifier: string;
  typename: T;
  storageSpecifier: StorageClass | null;
  functionSpecifier: "inline" | null;

  declaratorId: DeclaratorId;

  initializer?: T extends FunctionTypename ? null : InitializerNode;

  /**
   * Not in use for "register" and "typedef" storage
   */
  memoryOffset?: number;
  memoryIsGlobal?: boolean;
};

/**
 * Proper name for this should be "parameter-declaration"
 * Because it consists of only one declaration and have no initializer
 */
export type DeclaratorNode = DeclaratorNodeGeneric<Typename>;
export type DeclaratorNodeFunction = DeclaratorNodeGeneric<FunctionTypename>;

export type Node =
  | ExpressionNode
  | Typename
  | DeclaratorNode
  | FunctionDefinition
  | CompoundStatement
  | CompoundStatementBody
  | InitializerNode;
export type NodeLocator = Map<Node, TokenLocation>;

export interface IfStatement {
  type: "if";
  condition: ExpressionNode;
  iftrue: Statement;
  iffalse?: Statement;
}

export interface WhileStatement {
  type: "while";
  condition: ExpressionNode;
  body: Statement;
}

export interface DoWhileStatement {
  type: "dowhile";
  condition: ExpressionNode;
  body: Statement;
}
export interface ContinueStatement {
  type: "continue";
}
export interface BreakStatement {
  type: "break";
}
export interface ReturnStatement {
  type: "return";
  expression?: ExpressionNode;
}

export interface ExpressionStatement {
  type: "expression";
  expression: ExpressionNode;
}

export interface EmpryExpressionStatement {
  type: "noop";
}

export type Statement =
  | IfStatement
  | WhileStatement
  | DoWhileStatement
  | ContinueStatement
  | BreakStatement
  | ReturnStatement
  | CompoundStatement
  | ExpressionStatement
  | EmpryExpressionStatement;

export type InitializerNode =
  | {
      type: "assigmnent-expression";
      expression: ExpressionNode;
    }
  | {
      type: "initializer-list";
      // TODO
    };

export type CompoundStatementBody = Statement | DeclaratorNode;

export type CompoundStatement = {
  type: "compound-statement";
  body: CompoundStatementBody[];
};

export type FunctionDefinition = {
  type: "function-declaration";
  declaration: DeclaratorNodeFunction;
  body: CompoundStatementBody[];
  declaredVariables: DeclaratorId[];
};

export type ExternalDeclarations = (FunctionDefinition | DeclaratorNode)[];

export type DeclaratorMap = Map<DeclaratorId, DeclaratorNode>;

export type TranslationUnit = {
  type: "translation-unit";
  body: ExternalDeclarations;
  declarations: DeclaratorId[];
  /**
   *  A function here to support JSON.stringify
   *  If deserialized, then map should be recalculated
   */
  declaratorMap: () => DeclaratorMap;

  /** Same reasons as declaratorMap.
   *  Maybe every node should have own "location" property
   */
  locationMap: () => NodeLocator;
};
