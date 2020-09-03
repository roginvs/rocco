import {
  TranslationUnit,
  Node,
  FunctionDefinition,
  DeclaratorNode,
  AssignmentExpressionNode,
  Typename,
  ExpressionNode,
  IdentifierNode,
} from "./core/parser.definitions";
import { TokenLocation } from "./core/error";
import { assertNever } from "./core/assertNever";
import { CheckerError } from "./core/error";

export interface CheckerWarning extends TokenLocation {
  msg: string;
}

export function checkTranslationUnit(unit: TranslationUnit): CheckerWarning[] {
  const warnings: CheckerWarning[] = [];

  const locator = unit.locationMap();
  const declaratorMap = unit.declaratorMap();

  function getDeclaration(identifier: IdentifierNode) {
    const declaration = declaratorMap.get(identifier.declaratorNodeId);
    if (!declaration) {
      error(
        identifier,
        `Internal error: unable to find declaration ${identifier.declaratorNodeId}`
      );
    }
    return declaration;
  }

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

  function haveLvalue(expression: ExpressionNode) {
    if (expression.type === "identifier") {
      const type = getDeclaration(expression);
      if (type.typename.const) {
        return false;
      }
      if (type.typename.type === "arithmetic") {
        return true;
      } else if (type.typename.type === "pointer") {
        return true;
      } else if (
        type.typename.type === "enum" ||
        type.typename.type === "struct"
      ) {
        error(expression, "TODO: Not supported yet");
      } else if (type.typename.type === "void") {
        return false;
      }
    } else if (expression.type === "subscript operator") {
      const target = expression.target;
      const index = expression.index;
      const targetType = getExpressionType(target);
      if (targetType.type !== "array") {
        error(target, "Not an array");
      }
      if (targetType.elementsTypename.const) {
        error(target, "Elements are const");
      }
      const indexType = getExpressionType(index);
      if (indexType.type !== "arithmetic") {
        error(index, "Index should be arithmetic");
      }
      if (
        indexType.arithmeticType !== "char" &&
        indexType.arithmeticType !== "int"
      ) {
        error(index, "Wrong type for index. Only char and ints. No float ");
      }
    } else if (expression.type === "const") {
      return false;
    } else {
      // TODO
      return false;
    }
  }

  // TODO: Caching
  function getExpressionType(expression: ExpressionNode): Typename {
    if (expression.type === "const") {
      if (expression.subtype === "int") {
        // TODO: All sizes check
        return {
          type: "arithmetic",
          arithmeticType: "int",
          const: true,
          signedUnsigned: "signed",
        };
      } else if (expression.subtype === "float") {
        return {
          type: "arithmetic",
          arithmeticType: "double",
          const: true,
          signedUnsigned: "signed",
        };
      } else if (expression.subtype === "char") {
        return {
          type: "arithmetic",
          arithmeticType: "char",
          const: true,
          signedUnsigned: "unsigned",
        };
      } else {
        assertNever(expression.subtype);
      }
    } else if (expression.type === "binary operator") {
      const left = getExpressionType(expression.left);
      const right = getExpressionType(expression.right);
      if (left.type === "arithmetic" && right.type === "arithmetic") {
        // TODO: Proper way
        if (left.arithmeticType === "int" && right.arithmeticType === "int") {
          return left;
        } else if (
          left.arithmeticType === "float" ||
          right.arithmeticType === "float"
        ) {
          error(expression, "Float type is not supported yet");
        } else if (
          left.arithmeticType === "char" &&
          right.arithmeticType === "int"
        ) {
          return right;
        } else if (
          left.arithmeticType === "int" &&
          right.arithmeticType === "char"
        ) {
          return left;
        } else if (
          left.arithmeticType === "char" &&
          right.arithmeticType === "char"
        ) {
          // Lol, what if multiplication between two chars?
          return left;
        } else {
          error(expression, "Not supported yet");
        }
      } else if (left.type === "pointer" && right.type === "arithmetic") {
        if (right.arithmeticType !== "int" && right.arithmeticType !== "char") {
          error(expression, "not supported yet");
        }
        if (expression.operator !== "+" && expression.operator !== "-") {
          error(expression, "Wrong operator for pointer and arithmetic type");
        }
        return left;
      } else if (left.type === "arithmetic" && right.type === "pointer") {
        error(expression, "Not supported yet. Change left and right");
      } else {
        error(expression, "Not supported yet");
      }
    } else if (expression.type === "assignment") {
      if (!haveLvalue(expression.lvalue)) {
        error(expression.lvalue, "Not an lvalue");
      }
      throw new Error("todo");
    }
    // TODO
    throw new Error("TODO");
  }

  function checkExpression(expression: ExpressionNode) {
    getExpressionType(expression);
    return;
  }

  function checkIsAssignmentPossible(lvalue: Typename, rvalue: Typename) {
    if (lvalue.type === "arithmetic" && rvalue.type === "arithmetic") {
      return;
    }
    if (lvalue.type === "pointer" && rvalue.type === "arithmetic") {
      if (rvalue.arithmeticType === "char" || rvalue.arithmeticType === "int") {
        warn(lvalue, `Assignnment of int to pointer`);
      } else {
        error(lvalue, "TODO: Other types or error on float");
      }
      return true;
    }
    throw new Error("TODO");
  }

  function isExpessionKnownAtCompilationTime(
    expression: ExpressionNode
  ): boolean {
    checkExpression(expression);
    if (expression.type === "const") {
      return true;
    } else if (expression.type === "binary operator") {
      return (
        isExpessionKnownAtCompilationTime(expression.left) &&
        isExpessionKnownAtCompilationTime(expression.right)
      );
    } else {
      return false;
      // @TODO
    }
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
