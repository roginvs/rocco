import {
  TranslationUnit,
  Node,
  FunctionDefinition,
  DeclaratorNode,
  AssignmentExpressionNode,
  Typename,
  ExpressionNode,
  IdentifierNode,
} from "./parser.definitions";
import { TokenLocation } from "./error";
import { assertNever } from "./assertNever";
import { CheckerError } from "./error";
import { type } from "os";

export interface CheckerWarning extends TokenLocation {
  msg: string;
}

function cacheFunc<T, U>(func: (param1: T) => U): (param1: T) => U {
  const cache = new Map<T, U>();
  return (param1) => {
    const cached = cache.get(param1);
    if (cached) {
      return cached;
    } else {
      const value = func(param1);
      cache.set(param1, value);
      return value;
    }
  };
}

type WAInstuction = string;

export function emit(unit: TranslationUnit) {
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

  const typeSize = (type: Typename): ExpressionNode | undefined | number => {
    // Fixed size = number
    // Depended size = expression
    // Incomplete = undefined
    if (type.type === "arithmetic") {
      if (type.arithmeticType === "char") {
        return 1;
      } else if (type.arithmeticType === "int") {
        return 4;
      } else {
        error(type, "Not supported yet");
      }
    } else if (type.type === "array") {
      const elementSize = typeSize(type.elementsTypename);

      if (type.size === null) {
        return undefined;
      }
      if (type.size === "*") {
        error(type, "Star in array is not supported");
      }

      const size = expressionInfo(type.size);

      if (typeof elementSize === "number" && size.staticValue) {
        return elementSize * size.staticValue;
      } else {
        error(
          type,
          "Dynamic arrays are not supported yet. Todo: return created expression for size if possible"
        );
      }
    } else if (type.type === "enum" || type.type === "struct") {
      error(type, "Not supported yet");
    } else if (type.type === "function" || type.type === "function-knr") {
      error(type, "Internal error: functions have no size");
    } else if (type.type === "pointer") {
      return 4;
    } else if (type.type === "void") {
      error(type, "Void have no size");
    } else {
      assertNever(type);
    }
  };

  interface ExpressionInfo {
    type: Typename;
    rvalue: WAInstuction[];
    lvalue: WAInstuction[] | null;
    staticValue: number | null;
  }
  const expressionInfo = (expression: ExpressionNode): ExpressionInfo => {
    // type
    // rvalue code = address in stack
    // lvalue code (if any)
    // static value (if known)
    if (expression.type === "const") {
      if (expression.subtype === "int" || expression.subtype === "char") {
        return {
          type: {
            type: "arithmetic",
            arithmeticType: expression.subtype,
            const: true,
            signedUnsigned: "signed",
          },
          rvalue: [`i32.const ${expression.value}`],
          lvalue: null,
          staticValue: expression.value,
        };
      } else if (expression.subtype === "float") {
        error(expression, "Floats are not supported yet");
      }
    }

    throw new Error("TODO");
  };

  return {
    warnings,
  };
}
