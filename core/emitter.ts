import {
  TranslationUnit,
  Node,
  FunctionDefinition,
  DeclaratorNode,
  AssignmentExpressionNode,
  Typename,
  ExpressionNode,
  IdentifierNode,
  DeclaratorId,
  CompoundStatementBody,
} from "./parser.definitions";
import { TokenLocation } from "./error";
import { assertNever } from "./assertNever";
import { CheckerError } from "./error";
import { type } from "os";
import { stat, write } from "fs";

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

  function getDeclaration(declaratorId: DeclaratorId) {
    const declaration = declaratorMap.get(declaratorId);
    if (!declaration) {
      throw new Error(
        `Internal error: unable to find declaration ${declaratorId}`
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

  interface ExpressionInfo {
    type: Typename;

    // For int and floats - just value on stack
    value: () => WAInstuction[] | null;

    address: () => WAInstuction[] | null;

    staticValue: number | null;
  }
  const getExpressionInfo = (expression: ExpressionNode): ExpressionInfo => {
    // type
    // rvalue code = address in stack
    // lvalue code (if any)
    // static value (if known)

    const readArithmetic = (
      t: Typename,
      alignment = 2,
      offset = 0
    ): WAInstuction => {
      if (t.type !== "arithmetic") {
        throw new Error("Internal error");
      }
      if (t.arithmeticType === "int") {
        return `i32.load offset=${offset} align=${alignment} ;; readArithmetic int`;
      } else if (t.arithmeticType === "char") {
        if (t.signedUnsigned === "signed") {
          return `i32.load8_s offset=${offset} align=${alignment}`;
        } else {
          return `i32.load8_u offset=${offset} align=${alignment} `;
        }
      }
      throw new Error("Internal error or not suppored yet");
    };

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
      const declaration = getDeclaration(expression.declaratorNodeId);
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
                    readArithmetic(declaration.typename),
                  ]
                : [
                    `local.get $ebp`,
                    readArithmetic(
                      declaration.typename,
                      2,
                      declaration.memoryOffset
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
              ? [`i32.const ${declaration.memoryOffset}`, `i32.load 2 0`]
              : [`local.get $ebp`, `i32.load 2 ${declaration.memoryOffset}`],
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
        if (indexValue) {
          return [...arrayAddress, ...indexValue, `i32.add`];
        }
        const indexAddress = indexInfo.address();
        if (indexAddress) {
          return [...arrayAddress, ...indexAddress, `i32.load`, `i32.add`];
        }
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
            readArithmetic(targetInfo.type.elementsTypename, 0, 0),
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
    }

    error(expression, "TODO other expressionInfo");
  };

  // Initial step: assign global memory
  let memoryOffsetForGlobals = 8; // 4 for move from 0 address, and 0x4 for esp
  const readEspCode: WAInstuction[] = [
    `i32.const 4 ;; Read $esp`,
    "i32.load offset=0 align=2 ;; Read $esp",
  ];
  const writeEspCode = (value: WAInstuction[]) => [
    `i32.const 4 ;; Prepare $esp write - address`,
    ...value,
    `i32.store offset=0 align=2 ;; Write $esp`,
  ];

  let functionIdAddress = 1;
  const globalsInitializers: WAInstuction[] = [];
  for (const declarationId of unit.declarations) {
    const declaration = getDeclaration(declarationId);
    if (declaration.typename.type === "function") {
      declaration.memoryOffset = functionIdAddress;
      functionIdAddress++;
      continue;
    }
    if (declaration.typename.type === "function-knr") {
      throw new Error("No K&R here");
    }
    if (declaration.typename.type === "void") {
      error(declaration, "Void for variable is not allowed");
    }
    const size = getTypeSize(declaration.typename);
    if (typeof size !== "number") {
      error(declaration, `Globals must have known size`);
    }
    if (memoryOffsetForGlobals % 4 !== 0) {
      throw new Error("Self-check failed, wrong alignment");
    }
    declaration.memoryOffset = memoryOffsetForGlobals;
    declaration.memoryIsGlobal = true;
    memoryOffsetForGlobals += size;
    const alignment = memoryOffsetForGlobals % 4;
    if (alignment !== 0) {
      memoryOffsetForGlobals += 4 - alignment;
    }

    if (declaration.initializer) {
      if (declaration.typename.type === "arithmetic") {
        if (declaration.initializer.type !== "assigmnent-expression") {
          error(
            declaration.initializer,
            "Wrong iniializer for arithmetic type"
          );
        }

        const initializerExpressionInfo = getExpressionInfo(
          declaration.initializer.expression
        );
        if (initializerExpressionInfo.type.type !== "arithmetic") {
          error(declaration.initializer.expression, "Must be arithmetic");
        }
        if (initializerExpressionInfo.staticValue === null) {
          error(
            declaration.initializer.expression,
            "Initializer value must be known on compilation time"
          );
        }
        if (initializerExpressionInfo.type.arithmeticType !== "int") {
          error(
            declaration.initializer.expression,
            "TODO: Only int is supported for initializers"
          );
        }

        globalsInitializers.push(
          `;; Initializer for global ${declaration.identifier} id=${declaration.declaratorId}`,
          // For declarators we do not have "address" function we duplicate code here
          `i32.const ${declaration.memoryOffset} ;; global address`,
          `i32.const ${initializerExpressionInfo.staticValue} ;; value`,
          // Everything have 4-bytes alignment, so it is ok to load 8 bytes as i32
          `i32.store offset=0 align=2 `
        );
      }
    }
  }

  console.info(
    `Globals size = ${
      memoryOffsetForGlobals - 4
    }, usable memory from ${memoryOffsetForGlobals}`
  );

  function createFunctionCode(func: FunctionDefinition): WAInstuction[] {
    let inFuncAddress = 0;
    for (const declarationId of func.declaredVariables) {
      const declaration = getDeclaration(declarationId);
      const size = getTypeSize(declaration.typename);
      if (typeof size !== "number") {
        error(declaration, "Dynamic or incomplete size is not supported yet");
      }
      declaration.memoryOffset = inFuncAddress;
      declaration.memoryIsGlobal = false;
      inFuncAddress += size;
    }

    const returnTypeCode =
      (func.declaration.typename.returnType.type === "arithmetic" &&
        (func.declaration.typename.returnType.arithmeticType === "int" ||
          func.declaration.typename.returnType.arithmeticType === "char")) ||
      func.declaration.typename.returnType.type === "pointer"
        ? `(result i32)`
        : func.declaration.typename.returnType.type === "void"
        ? ""
        : undefined;
    if (returnTypeCode === undefined) {
      error(
        func.declaration.typename.returnType,
        "This return type is not supported yet"
      );
    }

    function createFunctionCodeForBlock(
      body: CompoundStatementBody[]
    ): WAInstuction[] {
      const code: WAInstuction[] = [];
      let returnFound = false;
      for (const statement of body) {
        if (returnFound) {
          warn(statement, "Unreachable code detected");
          continue;
        }

        if (statement.type === "declarator") {
          // TODO: Dynamic arrays case

          if (statement.initializer) {
            if (statement.initializer.type === "initializer-list") {
              error(statement.initializer, "Not supported yet");
            } else if (statement.initializer.type === "assigmnent-expression") {
              if (statement.memoryIsGlobal) {
                continue;
              }
              const initializerInfo = getExpressionInfo(
                statement.initializer.expression
              );
              const initializerValueCode = initializerInfo.value();
              if (!initializerValueCode) {
                error(statement.initializer.expression, "Must return a value");
              }
              code.push(
                `;; Initializer for local ${statement.identifier} id=${statement.declaratorId}`,

                // For declarators we do not have "address" function we duplicate code here
                `local.get $ebp ;;  address, first part`,

                ...initializerValueCode,
                // Everything have 4-bytes alignment, so it is ok to load 8 bytes as i32
                `i32.store offset=${statement.memoryOffset} align=2 `
              );
            } else {
              assertNever(statement.initializer);
            }
          }
        } else if (statement.type === "return") {
          code.push(";; return");
          if (func.declaration.typename.returnType.type === "void") {
            if (statement.expression) {
              error(
                statement.expression,
                "void function should not return value"
              );
            }
            // Do not place anything on stack
          } else {
            if (!statement.expression) {
              error(statement, "Must be an expression here");
            }
            const returnExpressionInfo = getExpressionInfo(
              statement.expression
            );
            const returnExpressionValueCode = returnExpressionInfo.value();

            if (
              (func.declaration.typename.returnType.type === "arithmetic" &&
                (func.declaration.typename.returnType.arithmeticType ===
                  "int" ||
                  func.declaration.typename.returnType.arithmeticType ===
                    "char")) ||
              func.declaration.typename.returnType.type === "pointer"
            ) {
              if (!returnExpressionValueCode) {
                error(statement.expression, "Must be a value here");
              }
              code.push(...returnExpressionValueCode);
            } else {
              error(statement, "This return type is not supported yet");
            }
          }

          code.push("br 0 ;; TODO TODO use real depth here");
          returnFound = true;
        } else {
          error(statement, "TODO statement");
        }
      }

      return code;
    }

    const funcCode: WAInstuction[] = createFunctionCodeForBlock(func.body);

    const returnCode: WAInstuction[] = [...writeEspCode([`local.get $ebp`])];

    // asdasd
    // generate function code here

    return [
      `;; Function ${func.declaration.identifier} localSize=${inFuncAddress}`,
      `(func $F${func.declaration.declaratorId} ${returnTypeCode}(local $ebp i32)`,
      ...readEspCode,
      `local.set $ebp ;; Save esp -> ebp`,

      ...writeEspCode([
        `local.get $ebp`,
        `i32.const ${inFuncAddress}`,
        `i32.add ;; Add all locals to esp`,
      ]),
      `;; Function body`,
      `block ${returnTypeCode};; main function block `,
      ...funcCode,
      "end ;; main function block end",
      `;; Cleanup`,
      ...returnCode,
      `)`,
      "",
      `(export "${func.declaration.identifier}" (func $F${func.declaration.declaratorId}))`,
      "",
    ];
  }

  const functionsCode: WAInstuction[] = [];
  // Now create functions
  for (const statement of unit.body) {
    if (statement.type === "function-declaration") {
      const lines = createFunctionCode(statement);
      functionsCode.push(...lines);
    }
  }

  const setupEsp: WAInstuction[] = [
    ...writeEspCode([`i32.const ${memoryOffsetForGlobals} ;; Prepare esp`]),
  ];

  const debugHelpers: WAInstuction[] = [
    `(func (export "_debug_get_esp") (result i32)`,
    ...readEspCode,
    ")",
  ];

  const moduleCode: WAInstuction[] = [
    "(module",

    `(import "js" "memory" (memory 0))`,

    //'(global $esp (import "js" "esp") (mut i32))',
    //"(global $esp (mut i32))",

    " (func $init  ",
    ...setupEsp,
    ...globalsInitializers,
    ")",
    " (start $init)",

    ...functionsCode,

    ...debugHelpers,
    ")",
  ];

  return {
    warnings,
    moduleCode,
  };
}