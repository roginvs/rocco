import { ExpressionNode, Typename, Node } from "./parser.definitions";
import { ExpressionInfo, WAInstuction } from "./emitter.definitions";
import { assertNever } from "./assertNever";
import { EmitterHelpers } from "./emitter.helpers";
import { typenameToRegister } from "./emitter.utils";
import { storeScalar, loadScalar } from "./emitter.scalar.storeload";
import { isScalar } from "./emitter.scalar";
import { timeLog } from "console";

export type TypeSize =
  | {
      type: "static";
      value: number;
    }
  | {
      type: "incomplete";
    }
  | {
      type: "expression";
      expression: ExpressionNode;
    };

export type TypeSizeGetter = (typename: Typename) => TypeSize;

export type ExpressionInfoGetter = (
  expression: ExpressionNode
) => ExpressionInfo;

export interface ExpressionAndTypes {
  getTypeSize: TypeSizeGetter;
  getExpressionInfo: ExpressionInfoGetter;
}

export function createExpressionAndTypes(
  helpers: EmitterHelpers
): ExpressionAndTypes {
  const { warn, cloneLocation, getDeclaration } = helpers;

  function error(node: Node, msg: string): never {
    helpers.error(node, msg);
  }

  const getTypeSize: TypeSizeGetter = (typename) => {
    // Fixed size = number
    // Depended size = expression
    // Incomplete = undefined
    const staticSize = (value: number): TypeSize => ({
      type: "static",
      value: value,
    });
    const incomleteSize: TypeSize = {
      type: "incomplete",
    };
    const expressionSize = (expression: ExpressionNode): TypeSize => ({
      type: "expression",
      expression: expression,
    });

    if (typename.type === "arithmetic") {
      if (typename.arithmeticType === "char") {
        return staticSize(1);
      } else if (typename.arithmeticType === "int") {
        return staticSize(4);
      } else {
        error(typename, "Not supported yet");
      }
    } else if (typename.type === "array") {
      const elementSize = getTypeSize(typename.elementsTypename);

      if (typename.size === null) {
        return incomleteSize;
      }
      if (typename.size === "*") {
        error(typename, "Star in array is not supported");
      }

      const size = getExpressionInfo(typename.size);

      if (elementSize.type === "static" && size.staticValue) {
        return staticSize(elementSize.value * size.staticValue);
      } else {
        error(
          typename,
          "Dynamic arrays are not supported yet. Todo: return created expression for size if possible"
        );
      }
    } else if (typename.type === "enum" || typename.type === "struct") {
      error(typename, "Not supported yet");
    } else if (
      typename.type === "function" ||
      typename.type === "function-knr"
    ) {
      error(
        typename,
        "6.5.3.4: The sizeof operator shall not be applied to an expression that has function type"
      );
    } else if (typename.type === "pointer") {
      return staticSize(4);
    } else if (typename.type === "void") {
      error(typename, "Void have no size");
    } else {
      assertNever(typename);
    }
  };

  const isArrayStaticSize = (node: Typename) => {
    if (node.type !== "array") {
      throw new Error("Internal error: isArrayStaticSize called for non-array");
    }
    const size = getTypeSize(node);
    if (size.type === "static") {
      return true;
    } else {
      return false;
    }
  };

  const getExpressionInfo = (expression: ExpressionNode): ExpressionInfo => {
    if (expression.type === "const") {
      // TODO: Change ExperssionNode type to hold stringified value instead of number
      if (expression.subtype === "char") {
        if (expression.value > 255) {
          throw new Error("Assertion failed: char > 255");
        }
        if (expression.value < -128) {
          throw new Error("Assertion failed: char < -128");
        }
        const typeNode: Typename = {
          type: "arithmetic",
          arithmeticType: "char",
          const: true,
          signedUnsigned: expression.value >= 0 ? null : "signed",
        };
        cloneLocation(expression, typeNode);
        return {
          type: typeNode,
          value: () => [`i32.const ${expression.value}`],
          address: null,
          staticValue: expression.value,
        };
      } else if (expression.subtype === "int") {
        const INT_MIN = -(2 ** 31);
        const UINT_MAX = 2 ** 32 - 1;
        if (expression.value <= UINT_MAX && expression.value >= INT_MIN) {
          // Always store as 4 bytes because our registers are 4 bytes
          const typeNode: Typename = {
            type: "arithmetic",
            arithmeticType: "int",
            const: true,
            signedUnsigned: expression.value >= 0 ? null : "signed",
          };
          cloneLocation(expression, typeNode);
          return {
            type: typeNode,
            value: () => [`i32.const ${expression.value}`],
            address: null,
            staticValue: expression.value,
          };
        } else {
          const typeNode: Typename = {
            type: "arithmetic",
            arithmeticType: "long long",
            const: true,
            signedUnsigned: expression.value >= 0 ? null : "signed",
          };
          cloneLocation(expression, typeNode);
          return {
            type: typeNode,
            value: () => [`i64.const ${expression.value}`],
            address: null,
            staticValue: expression.value,
          };
        }
      } else if (expression.subtype === "float") {
        error(expression, "Floats are not supported yet");
      }
    } else if (expression.type === "identifier") {
      const declaration = getDeclaration(expression.declaratorNodeId);
      if (declaration.typename.type === "arithmetic") {
        if (
          declaration.typename.arithmeticType === "char" ||
          declaration.typename.arithmeticType === "int"
        ) {
          let staticValue: number | null = null;
          if (
            declaration.typename.const /** todo: check volatile */ &&
            declaration.initializer &&
            declaration.initializer.type === "assigmnent-expression"
          ) {
            const initializerInfo = getExpressionInfo(
              declaration.initializer.expression
            );
            if (initializerInfo.staticValue) {
              staticValue = initializerInfo.staticValue;
            }
          }
          return {
            type: declaration.typename,
            staticValue: staticValue,
            value: () =>
              declaration.memoryIsGlobal
                ? [
                    `i32.const ${declaration.memoryOffset}`,
                    loadScalar(declaration.typename, "i32"),
                  ]
                : [
                    `local.get $ebp`,
                    loadScalar(
                      declaration.typename,
                      "i32",
                      declaration.memoryOffset,
                      2
                    ),
                  ],
            address: () =>
              declaration.memoryIsGlobal
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
          value: null,
          address: () => [`i32.const ${declaration.memoryOffset}`],
        };
      } else if (declaration.typename.type === "pointer") {
        return {
          type: declaration.typename,
          staticValue: null,
          value: () =>
            declaration.memoryIsGlobal
              ? [
                  `i32.const ${declaration.memoryOffset}`,
                  loadScalar(declaration.typename, "i32", 0, 2),
                ]
              : [
                  `local.get $ebp`,
                  loadScalar(
                    declaration.typename,
                    "i32",
                    declaration.memoryOffset,
                    2
                  ),
                ],
          address: () =>
            declaration.memoryIsGlobal
              ? [`i32.const ${declaration.memoryOffset}`]
              : [
                  `local.get $ebp`,
                  `i32.const ${declaration.memoryOffset}`,
                  `i32.add`,
                ],
        };
      } else if (declaration.typename.type === "array") {
        if (!isArrayStaticSize(declaration.typename)) {
          error(declaration, "TODO: Dynamic arrays are not supported yet");
        }

        return {
          type: declaration.typename,
          staticValue: null,
          value: null,
          address: () => {
            return declaration.memoryIsGlobal
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
      const targetInfo = getExpressionInfo(target);
      const indexInfo = getExpressionInfo(index);

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

      const elementsSize = getTypeSize(targetInfo.type.elementsTypename);
      if (elementsSize.type !== "static") {
        error(
          targetInfo.type.elementsTypename,
          "Dynamic arrays are not supported yet"
        );
      }

      if (!targetInfo.address) {
        error(target, "Array must have address");
      }
      const getArrayAddress = targetInfo.address;

      if (!indexInfo.value) {
        error(index, "Must be a value here");
      }

      const getIndexValue = indexInfo.value;

      const getArrayElementAddress = () => {
        const indexOffset: WAInstuction[] = [
          ...getIndexValue(),
          `i32.const ${elementsSize.value}`,
          `i32.mul`,
        ];
        return [...getArrayAddress(), ...indexOffset, `i32.add`];
      };

      const elementsTypename = targetInfo.type.elementsTypename;
      const getArrayElementValue = isScalar(elementsTypename)
        ? () => [
            ...getArrayElementAddress(),
            loadScalar(elementsTypename, "i32", 0, 0),
          ]
        : null;

      return {
        type: targetInfo.type.elementsTypename,
        staticValue: null,
        value: getArrayElementValue,
        address: getArrayElementAddress,
      };
    } else if (expression.type === "binary operator") {
      const leftInfo = getExpressionInfo(expression.left);
      const rightInfo = getExpressionInfo(expression.right);

      const op = expression.operator;

      // Very hacky
      if (
        leftInfo.type.type === "arithmetic" &&
        (leftInfo.type.arithmeticType === "char" ||
          leftInfo.type.arithmeticType === "int") &&
        rightInfo.type.type === "arithmetic" &&
        (rightInfo.type.arithmeticType === "char" ||
          rightInfo.type.arithmeticType === "int")
      ) {
        const finalType =
          leftInfo.type.arithmeticType === "char" &&
          rightInfo.type.arithmeticType === "char"
            ? leftInfo.type
            : leftInfo.type.arithmeticType === "int"
            ? leftInfo.type
            : rightInfo.type;

        const operatorInstruction =
          op === "+"
            ? "i32.add"
            : op === "-"
            ? "i32.sub"
            : op === "*"
            ? "i32.mul"
            : op === "/"
            ? finalType.signedUnsigned === "signed"
              ? "i32.div_s"
              : "i32.div_u"
            : op === "%"
            ? finalType.signedUnsigned === "signed"
              ? "i32.rem_s"
              : "i32.rem_u"
            : op === "&"
            ? "i32.and"
            : op === "|"
            ? "i32.or"
            : op === "&&"
            ? "i32.and"
            : op === "||"
            ? "i32.or"
            : undefined;
        const prepareInstructions =
          op === "&&" || op === "||"
            ? [
                "ieqz ;; Return 1 if i is zero, 0 overwise",
                "ieqz ;; Invert value",
              ]
            : [];
        if (!operatorInstruction) {
          error(expression, `TODO: This operator ${op} is not implemented`);
        }

        // Todo: other operators here too
        // todo: pay attention for operands type
        const staticValue =
          leftInfo.staticValue && rightInfo.staticValue
            ? op === "+"
              ? leftInfo.staticValue + rightInfo.staticValue
              : op === "-"
              ? leftInfo.staticValue - rightInfo.staticValue
              : null
            : null;

        const getLeftValue = leftInfo.value;
        if (!getLeftValue) {
          error(expression.left, "Must have a value");
        }
        const getRightValue = rightInfo.value;
        if (!getRightValue) {
          error(expression.right, "Must have a value");
        }

        return {
          type: finalType,
          staticValue: staticValue,
          address: null,
          value: () => {
            return [
              ...getLeftValue(),
              ...prepareInstructions,
              ...getRightValue(),
              ...prepareInstructions,
              operatorInstruction,
            ];
          },
        };
      } else {
        error(
          expression,
          "Not supported yet. Todo: other types for binary operations"
        );
      }
    } else if (expression.type === "assignment") {
      const lvalueInfo = getExpressionInfo(expression.lvalue);
      const rvalueInfo = getExpressionInfo(expression.rvalue);

      const lvalueIsInRegister = typenameToRegister(lvalueInfo.type);
      if (!lvalueIsInRegister) {
        error(
          expression.lvalue,
          `Assignment to this type=${lvalueInfo.type} is not supported yet`
        );
      }

      if (lvalueIsInRegister !== typenameToRegister(rvalueInfo.type)) {
        // For example, i32 -> i64
        error(
          expression.rvalue,
          `Type assigment ${rvalueInfo.type} to ${lvalueInfo.type} is not supported yet`
        );
      }

      if (lvalueInfo.type.const) {
        error(expression.lvalue, "Have const modifier, unable to change");
      }

      const getLvalueAddress = lvalueInfo.address;
      if (!getLvalueAddress) {
        error(expression.lvalue, "Lvalue must have an address");
      }

      const getLvalueValue = lvalueInfo.value;
      if (!getLvalueValue) {
        error(
          expression.lvalue,
          "Lvalue must also have a value, at least for now"
        );
      }

      const getRvalueValue = rvalueInfo.value;
      if (!getRvalueValue) {
        error(expression.rvalue, "rvalue must have a value, at least for now");
      }

      const sideEffect = () => {
        return [
          ...getLvalueAddress(),
          ...getRvalueValue(),
          storeScalar(lvalueInfo.type, lvalueIsInRegister),
        ];
      };

      // not modifiable anymore
      const newTypeNode: Typename = { ...lvalueInfo.type, const: true };
      cloneLocation(lvalueInfo.type, newTypeNode);

      return {
        address: () => {
          // This should be never used because we add "const" modifier
          // And we now support only scalar values, so everything have value
          return [...sideEffect(), ...getLvalueAddress()];
        },
        value: () => {
          return [...sideEffect(), ...getLvalueValue()];
        },
        staticValue: null,
        type: newTypeNode,
      };
      // Get address of lvalue
      // Get value of rvalue (must be because in register)
      // Place value in memory using lvalue type (char, short, int, etc)
    } else if (expression.type === "unary-operator") {
      if (expression.operator === "&") {
        const target = expression.target;
        const targetInfo = getExpressionInfo(target);
        const getTargetAddress = targetInfo.address;
        if (!getTargetAddress) {
          error(expression.target, "Must be something with address");
        }
        const returnType: Typename = {
          type: "pointer",
          // Returned value is not an lvalue
          const: true,
          pointsTo: targetInfo.type,
        };
        cloneLocation(expression, returnType);
        return {
          type: returnType,
          address: null,
          staticValue: null,
          value: getTargetAddress,
        };
      } else {
        error(
          expression,
          `TODO: This unary operator ${expression.operator} is not supported yet`
        );
      }
    } else if (expression.type === "sizeof expression") {
      const typename: Typename = {
        type: "arithmetic",
        arithmeticType: "int",
        signedUnsigned: null,
        const: true,
      };
      cloneLocation(expression, typename);
      const info = getExpressionInfo(expression.expression);
      const size = getTypeSize(info.type);
      if (size.type === "incomplete") {
        error(
          expression.expression,
          "Unable to get size of expression with incomplete type"
        );
      } else if (size.type === "static") {
        return {
          address: null,
          staticValue: size.value,
          type: typename,

          value: () => [`i32.const ${size.value}`],
        };
      } else if (size.type === "expression") {
        const sizeExpressionInfo = getExpressionInfo(size.expression);
        const sizeExpressionValue = sizeExpressionInfo.value;
        if (!sizeExpressionValue) {
          error(
            size.expression,
            "Internal error: unable to get expression value"
          );
        }
        return {
          address: null,
          staticValue: null,
          type: typename,
          value: sizeExpressionValue,
        };
      } else {
        assertNever(size);
      }
    } else if (expression.type === "cast") {
      const targetInfo = getExpressionInfo(expression.target);
      // TODO: Other casts, change register if needed
      const targetRegister = typenameToRegister(targetInfo.type);
      if (targetRegister !== "i32") {
        error(expression.target, "TODO: Such casts are not supported yet");
      }
      if (targetRegister !== typenameToRegister(expression.typename)) {
        error(expression.typename, "TODO: Register change for casting");
      }
      return {
        type: expression.typename,
        staticValue: targetInfo.staticValue,
        value: targetInfo.value,
        address: targetInfo.address,
      };
    }

    error(expression, `TODO other expressionInfo for type=${expression.type}`);
  };

  return {
    getTypeSize,

    getExpressionInfo,
  };
}
