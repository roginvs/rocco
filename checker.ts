import {
  TranslationUnit,
  Node,
  FunctionDefinition,
  DeclaratorNode,
  AssignmentExpressionNode,
  Typename,
  ExpressionNode,
} from "./parser.definitions";
import { TokenLocation } from "./error";
import { assertNever } from "./assertNever";
import { CheckerError } from "./error";

export interface CheckerWarning extends TokenLocation {
  msg: string;
}

export function checkTranslationUnit(unit: TranslationUnit): CheckerWarning[] {
  const warnings: CheckerWarning[] = [];

  const locator = unit.locationMap();
  const declaratorMap = unit.declaratorMap();

  function warn(node: Node, msg: string) {
    const location = locator.get(node);
    if (!location) {
      console.warn(`Unable to find location for node type=${node.type}`);
      warnings.push({
        msg,
        length: 0,
        pos: 0,
        line: 0,
      });
    } else {
      warnings.push({
        msg,
        ...location,
      });
    }
  }
  function error(node: Node, msg: string): never {
    // TODO: Add error into errors list
    // Now we just throw
    const location = locator.get(node);
    if (!location) {
      console.warn(`Unable to find location for node type=${node.type}`);
      throw new CheckerError(`${msg}`, { pos: 0, line: 0, length: 0 });
    } else {
      throw new CheckerError(`${msg}`, location);
    }
  }

  // TODO: Caching
  function getExpressionType(expression: ExpressionNode): Typename {
    // TODO
    throw new Error("TODO");
  }

  function checkExpression(expression: ExpressionNode) {
    getExpressionType(expression);
    return;
  }

  function checkIsAssignmentPossible(lvalue: Typename, rvalue: Typename) {
    throw new Error("TODO");
  }

  function isExpessionKnownAtCompilationTime(
    expression: ExpressionNode
  ): boolean {
    throw new Error("TODO");
  }

  function checkDeclarator(declarator: DeclaratorNode, isFileScope: boolean) {
    if (declarator.typename.type === "function") {
      if (declarator.initializer !== null) {
        error(
          declarator,
          "Internal error: should be no initializer for function"
        );
      }
    } else if (declarator.typename.type === "function-knr") {
      error(
        declarator,
        "Internal error: K&R notations should be already transformed"
      );
    } else if (declarator.typename.type === "void") {
      error(declarator, "void type for variable, this is weird");
    } else if (declarator.typename.type === "arithmetic") {
      if (
        declarator.initializer &&
        declarator.initializer.type !== "assigmnent-expression"
      ) {
        error(
          declarator.initializer,
          "Only assigmnent-expression is allowed for arthmetic type"
        );
      }
    } else if (
      declarator.typename.type === "enum" ||
      declarator.typename.type === "struct"
    ) {
      error(declarator, "TODO: Not implemented");
    } else if (declarator.typename.type === "pointer") {
      if (declarator.initializer) {
        if (declarator.initializer.type !== "assigmnent-expression") {
          error(
            declarator.initializer,
            "Only assigmnent-expression is allowed for pointer type"
          );
        } else {
          const initializerType = getExpressionType(
            declarator.initializer.expression
          );
          checkIsAssignmentPossible(declarator.typename, initializerType);
        }
      }
    } else if (declarator.typename.type === "array") {
      if (declarator.initializer) {
        if (declarator.initializer.type === "assigmnent-expression") {
          error(declarator, "Wrong initializer for array");
        }
        error(declarator, "Initializers for array are not supported yet");
      }

      if (declarator.typename.size === "*") {
        error(declarator, "star modifier used outside of function prototype");
      }
      if (declarator.typename.size === null) {
        error(declarator, "Incomplete type is not allowed");
      }
      const isFixedSize = isExpessionKnownAtCompilationTime(
        declarator.typename.size
      );
      if (isFileScope) {
        if (!isFixedSize) {
          error(
            declarator,
            "variable length array declaration not allowed at file scope"
          );
        }
      } else {
        if (!isFixedSize) {
          error(
            declarator,
            "TODO: variable length array declaration is not implemented yet"
          );
        }
      }
    } else {
      assertNever(declarator.typename);
    }
  }

  function checkFunction(func: FunctionDefinition) {
    // todo
  }

  for (const statement of unit.body) {
    if (statement.type === "function-declaration") {
      checkFunction(statement);
    } else if (statement.type === "declarator") {
      checkDeclarator(statement, true);
    } else {
      assertNever(statement);
    }
  }

  return warnings;
}
