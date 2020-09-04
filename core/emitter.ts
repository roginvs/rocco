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
  TypenameScalar,
} from "./parser.definitions";
import { TokenLocation } from "./error";
import { assertNever } from "./assertNever";
import { CheckerError } from "./error";
import { type } from "os";
import { stat, write } from "fs";
import { assert } from "console";
import { WAInstuction } from "./emitter.definitions";
import { typenameToRegister } from "./emitter.utils";
import { createHelpers } from "./emitter.helpers";
import { createExpressionAndTypes } from "./emitter.expressionsandtypes";

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

export function emit(unit: TranslationUnit) {
  const locator = unit.locationMap();
  const declaratorMap = unit.declaratorMap();

  const helpers = createHelpers(locator, declaratorMap);

  const { warn, getDeclaration, warnings } = helpers;

  function error(node: Node, msg: string): never {
    helpers.error(node, msg);
    throw new Error("Typescript workaround");
  }

  const { getTypeSize, getExpressionInfo } = createExpressionAndTypes(helpers);

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

    const functionReturnsInRegister = typenameToRegister(
      func.declaration.typename.returnType
    );
    if (
      functionReturnsInRegister === null &&
      func.declaration.typename.returnType.type !== "void"
    ) {
      error(
        func.declaration.typename.returnType,
        "This return type is not supported yet"
      );
    }

    const returnValueLocalName = "$return_value";

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

            const expressionRegisterType = typenameToRegister(
              returnExpressionInfo.type
            );

            if (
              expressionRegisterType &&
              expressionRegisterType === functionReturnsInRegister
            ) {
              if (!returnExpressionValueCode) {
                error(
                  statement.expression,
                  `Internal error: Type ${returnExpressionInfo.type.type} must have value`
                );
              }
              code.push(...returnExpressionValueCode);
              code.push(`local.set ${returnValueLocalName}`);
            } else {
              error(
                statement.expression,
                "This return type is not supported yet"
              );
            }
          }

          code.push("br 0 ;; TODO TODO use real depth here");
          returnFound = true;
        } else if (statement.type === "expression") {
          const info = getExpressionInfo(statement.expression);
          // Here we need only side effects
          const value = info.value();
          const address = info.address();
          if (value) {
            code.push(...value);
          } else if (address) {
            code.push(...address);
          } else {
            error(
              statement.expression,
              "Internal error: expression must have value or address"
            );
          }
          code.push("drop");
        } else {
          error(statement, "TODO statement");
        }
      }

      return code;
    }

    const funcCode: WAInstuction[] = createFunctionCodeForBlock(func.body);

    const restoreEsp: WAInstuction[] = [...writeEspCode([`local.get $ebp`])];
    const returnValueInRegisterIfAny: WAInstuction[] = functionReturnsInRegister
      ? [`local.get ${returnValueLocalName}`]
      : [];

    return [
      `;; Function ${func.declaration.identifier} localSize=${inFuncAddress}`,
      `(func $F${func.declaration.declaratorId} ` +
        `${
          functionReturnsInRegister
            ? `(result ${functionReturnsInRegister})`
            : ""
        }` +
        `(local $ebp i32)` +
        (functionReturnsInRegister
          ? `(local ${returnValueLocalName} ${functionReturnsInRegister})`
          : ""),

      ...readEspCode,
      `local.set $ebp ;; Save esp -> ebp`,

      ...writeEspCode([
        `local.get $ebp`,
        `i32.const ${inFuncAddress}`,
        `i32.add ;; Add all locals to esp`,
      ]),
      `;; Function body`,
      `block ;; main function block `,
      ...funcCode,
      "end ;; main function block end",
      `;; Cleanup`,
      ...restoreEsp,
      ...returnValueInRegisterIfAny,
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
