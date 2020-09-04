import { ExpressionNode, Typename, Node } from "./parser.definitions";
import { ExpressionInfo, WAInstuction } from "./emitter.definitions";
import { assertNever } from "./assertNever";
import { EmitterHelpers } from "./emitter.helpers";
import { typenameToRegister } from "./emitter.utils";
import { storeScalar, loadScalar } from "./emitter.scalar.storeload";

export function createExpressionAndTypes(helpers: EmitterHelpers) {
  const { warn, cloneLocation, getDeclaration } = helpers;

  function error(node: Node, msg: string): never {
    helpers.error(node, msg);
  }

  const getTypeSize = (
    typename: Typename
  ): ExpressionNode | undefined | number => {
    // Fixed size = number
    // Depended size = expression
    // Incomplete = undefined
    if (typename.type === "arithmetic") {
      if (typename.arithmeticType === "char") {
        return 1;
      } else if (typename.arithmeticType === "int") {
        return 4;
      } else {
        error(typename, "Not supported yet");
      }
    } else if (typename.type === "array") {
      const elementSize = getTypeSize(typename.elementsTypename);

      if (typename.size === null) {
        return undefined;
      }
      if (typename.size === "*") {
        error(typename, "Star in array is not supported");
      }

      const size = getExpressionInfo(typename.size);

      if (typeof elementSize === "number" && size.staticValue) {
        return elementSize * size.staticValue;
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
      error(typename, "Internal error: functions have no size");
    } else if (typename.type === "pointer") {
      return 4;
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
    if (typeof size === "number") {
      return true;
    } else {
      return false;
    }
  };

  const getExpressionInfo = (expression: ExpressionNode): ExpressionInfo => {
    if (expression.type === "const") {
      if (expression.subtype === "int" || expression.subtype === "char") {
        const typeNode: Typename = {
          type: "arithmetic",
          arithmeticType: expression.subtype,
          const: true,
          signedUnsigned: "signed",
        };
        cloneLocation(expression, typeNode);
        return {
          type: typeNode,
          value: () => [`i32.const ${expression.value}`],
          address: () => null,
          staticValue: expression.value,
        };
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
          value: () => null,
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
        return {
          type: declaration.typename,
          staticValue: null,
          value: () => null,
          address: () => {
            if (!isArrayStaticSize(declaration.typename)) {
              error(declaration, "TODO: Dynamic arrays are not supported yet");
            }
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

      const getArrayElementAddress = () => {
        const arrayAddress = targetInfo.address();
        if (!arrayAddress) {
          return null;
        }
        const indexValue = indexInfo.value();
        if (!indexValue) {
          error(index, "Internal error: must have value");
        }
        if (1 + 1 === 2) {
          throw new Error("TODO: Multiply by element size");
        }
        return [...arrayAddress, ...indexValue, `i32.add`];

        return null;
      };
      return {
        type: targetInfo.type.elementsTypename,
        staticValue: null,
        value: () => {
          const address = getArrayElementAddress();
          if (!address) {
            return null;
          }
          if (targetInfo.type.type !== "array") {
            // Additinal check for TS
            return null;
          }
          if (targetInfo.type.elementsTypename.type !== "arithmetic") {
            return null;
          }
          return [
            ...address,
            loadScalar(targetInfo.type.elementsTypename, "i32", 0, 0),
          ];
        },
        address: () => getArrayElementAddress(),
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
        const staticValue =
          leftInfo.staticValue && rightInfo.staticValue
            ? op === "+"
              ? leftInfo.staticValue + rightInfo.staticValue
              : op === "-"
              ? leftInfo.staticValue - rightInfo.staticValue
              : null
            : null;
        return {
          type: finalType,
          staticValue: staticValue,
          address: () => null,
          value: () => {
            const leftVal = leftInfo.value();
            const rightVal = rightInfo.value();
            if (!leftVal) {
              return null;
            }
            if (!rightVal) {
              return null;
            }
            return [
              ...leftVal,
              ...prepareInstructions,
              ...rightVal,
              ...prepareInstructions,
              operatorInstruction,
            ];
          },
        };
        //
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

      if (lvalueIsInRegister !== "i32") {
        error(expression.lvalue, "Not supported yet");
      }

      if (lvalueInfo.type.const) {
        error(expression.lvalue, "Have const modifier, unable to change");
      }

      const sideEffect = () => {
        const lvalueAddress = lvalueInfo.address();
        if (!lvalueAddress) {
          error(expression.lvalue, "Not an lvalue");
        }
        const rvalueValue = rvalueInfo.value();
        if (!rvalueValue) {
          error(expression.rvalue, "Internal error: no value for rvalue");
        }
        return [
          ...lvalueAddress,
          ...rvalueValue,
          storeScalar(lvalueInfo.type, lvalueIsInRegister),
        ];
      };

      // not modifiable anymore
      const newTypeNode: Typename = { ...lvalueInfo.type, const: true };
      cloneLocation(lvalueInfo.type, newTypeNode);

      return {
        address: () => {
          const lvalueAddress = lvalueInfo.address();
          if (!lvalueAddress) {
            error(expression.lvalue, "lvalue have no address");
          }
          // This should be never used because we add "const" modifier
          // And we now support only i32 values, so everything have value
          return [...sideEffect(), ...lvalueAddress];
        },
        value: () => {
          const lvalueValue = lvalueInfo.value();
          if (!lvalueValue) {
            error(expression.lvalue, "lvalue have no value");
          }
          return [...sideEffect(), ...lvalueValue];
        },
        staticValue: null,
        type: newTypeNode,
      };
      // Get address of lvalue
      // Get value of rvalue (must be because in register)
      // Place value in memory using lvalue type (char, short, int, etc)
    }

    error(expression, `TODO other expressionInfo for type=${expression.type}`);
  };

  return {
    getTypeSize,
    isArrayStaticSize,
    getExpressionInfo,
  };
}
