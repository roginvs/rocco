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

  const isArrayStaticSize = (node: Typename) => {
    if (node.type !== "array") {
      throw new Error("Internal error: isArrayStaticSize called for non-array");
    }
    const size = typeSize(node);
    if (typeof size === "number") {
      return true;
    } else {
      return false;
    }
  };

  type InfoScope = "file" | "function";
  interface ExpressionInfo {
    type: Typename;

    // For int and floats - just value on stack
    value: (scope: InfoScope) => WAInstuction[] | null;

    address: (scope: InfoScope) => WAInstuction[] | null;

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
          value: () => [`i32.const ${expression.value}`],
          address: () => null,
          staticValue: expression.value,
        };
      } else if (expression.subtype === "float") {
        error(expression, "Floats are not supported yet");
      }
    } else if (expression.type === "identifier") {
      const declaration = getDeclaration(expression);
      if (declaration.typename.type === "arithmetic") {
        if (
          declaration.typename.arithmeticType === "char" ||
          declaration.typename.arithmeticType === "int"
        ) {
          const isChar = declaration.typename.arithmeticType === "char";
          const isSigned = declaration.typename.signedUnsigned === "signed";

          let staticValue: number | null = null;
          if (
            declaration.typename.const /** todo: check volatile */ &&
            declaration.initializer &&
            declaration.initializer.type === "assigmnent-expression"
          ) {
            const initializerInfo = expressionInfo(
              declaration.initializer.expression
            );
            if (initializerInfo.staticValue) {
              staticValue = initializerInfo.staticValue;
            }
          }
          return {
            type: declaration.typename,
            staticValue: staticValue,
            value: (scope) =>
              scope === "file"
                ? [
                    `i32.const ${declaration.memoryOffset}`,

                    isChar
                      ? isSigned
                        ? `i32.load8_s`
                        : `i32.load8_u`
                      : `i32.load 2 0`,
                  ]
                : [`local.get $ebp`, `i32.load 2 ${declaration.memoryOffset}`],
            address: (scope) =>
              scope === "file"
                ? [`i32.const ${declaration.memoryOffset}`]
                : [
                    `local.get $ebp`,
                    `i32.const ${declaration.memoryOffset}`,
                    `i32.add`,
                  ],
          };
        } else if (
          declaration.typename.arithmeticType === "double" ||
          declaration.typename.arithmeticType === "float"
        ) {
          error(expression, "Floats are not supported yet");
        } else {
          error(expression, "TODO support other types");
        }
      } else if (declaration.typename.type === "function-knr") {
        error(
          declaration,
          "Internal error: K&R notations should be replated to this point"
        );
      } else if (declaration.typename.type === "function") {
        return {
          type: declaration.typename,
          staticValue: null,
          value: () => null,
          address: () => [`i32.const ${declaration.memoryOffset}`],
        };
      } else if (declaration.typename.type === "pointer") {
        return {
          type: declaration.typename,
          staticValue: null,
          value: (scope) =>
            scope === "file"
              ? [`i32.const ${declaration.memoryOffset}`, `i32.load 2 0`]
              : [`local.get $ebp`, `i32.load 2 ${declaration.memoryOffset}`],
          address: (scope) =>
            scope === "file"
              ? [`i32.const ${declaration.memoryOffset}`]
              : [
                  `local.get $ebp`,
                  `i32.const ${declaration.memoryOffset}`,
                  `i32.add`,
                ],
        };
      } else if (declaration.typename.type === "array") {
        return {
          type: declaration.typename,
          staticValue: null,
          value: () => null,
          address: (scope) => {
            if (!isArrayStaticSize(declaration.typename)) {
              error(declaration, "TODO: Dynamic arrays are not supported yet");
            }
            return scope === "file"
              ? [`i32.const ${declaration.memoryOffset}`]
              : [
                  `local.get $ebp`,
                  `i32.const ${declaration.memoryOffset}`,
                  `i32.add`,
                ];
          },
        };
      } else if (
        declaration.typename.type === "enum" ||
        declaration.typename.type === "struct"
      ) {
        error(declaration, "TODO, not implemented yett");
      } else if (declaration.typename.type === "void") {
        error(declaration, "Used void declaration");
      } else {
        assertNever(declaration.typename);
      }
    } else if (expression.type === "subscript operator") {
      const target = expression.target;
      const index = expression.index;
      const targetInfo = expressionInfo(target);
      const indexInfo = expressionInfo(index);

      if (indexInfo.type.type !== "arithmetic") {
        error(index, "Must be arithmetic type");
      }
      if (
        indexInfo.type.arithmeticType !== "int" &&
        indexInfo.type.arithmeticType !== "char"
      ) {
        error(index, "Only int/char are supported now");
      }
      if (targetInfo.type.type !== "array") {
        error(target, "Must be array type");
      }

      const getAddress = (scope: InfoScope) => {
        const arrayAddress = targetInfo.address(scope);
        if (!arrayAddress) {
          return null;
        }
        const indexValue = indexInfo.value(scope);
        if (indexValue) {
          return [...arrayAddress, ...indexValue, `i32.add`];
        }
        const indexAddress = indexInfo.address(scope);
        if (indexAddress) {
          return [...arrayAddress, ...indexAddress, `i32.load`, `i32.add`];
        }
        return null;
      };
      return {
        type: targetInfo.type.elementsTypename,
        staticValue: null,
        value: (scope) => [
          // Now we have address of cell
          // But value is only possible to load if type of elements is int/char
          // TODO A function "loadIntBYaddress", same as above
        ],
        address: (scope) => getAddress(scope),
      };
    }

    throw new Error("TODO");
  };

  return {
    warnings,
  };
}
