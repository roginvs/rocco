import { EmitterHelpers } from "./emitter.helpers";
import {
  Node,
  FunctionDefinition,
  CompoundStatementBody,
  Statement,
} from "./parser.definitions";
import { WAInstuction } from "./emitter.definitions";
import {
  typenameToRegister as getTypenameRegister,
  writeEspCode,
  readEspCode,
} from "./emitter.utils";
import {
  TypeSizeGetter,
  ExpressionInfoGetter,
} from "./emitter.expressionsandtypes";
import { assertNever } from "./assertNever";
import { storeScalar } from "./emitter.scalar.storeload";

/**
 * Small helper to unwrap compound-statement
 */
function statementToCompoundStatementBody(
  statement: Statement
): CompoundStatementBody[] {
  if (statement.type === "compound-statement") {
    return statement.body;
  } else {
    return [statement];
  }
}

export function createFunctionCodeGenerator(
  helpers: EmitterHelpers,
  getTypeSize: TypeSizeGetter,
  getExpressionInfo: ExpressionInfoGetter
) {
  const { warn, getDeclaration } = helpers;

  function error(node: Node, msg: string): never {
    helpers.error(node, msg);
  }

  function createFunctionCode(func: FunctionDefinition): WAInstuction[] {
    let inFuncAddress = 0;
    for (const declarationId of func.declaredVariables) {
      const declaration = getDeclaration(declarationId);
      const size = getTypeSize(declaration.typename);
      if (size.type !== "static") {
        error(declaration, "Dynamic or incomplete size is not supported yet");
      }
      declaration.memoryOffset = inFuncAddress;
      declaration.memoryIsGlobal = false;
      inFuncAddress += size.value;
    }

    const functionReturnsInRegister = getTypenameRegister(
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
      body: CompoundStatementBody[],
      returnBrDepth: number,
      continueBrDepth: number | null
    ): WAInstuction[] {
      const breakBrDepth =
        continueBrDepth !== null ? continueBrDepth + 1 : null;
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

              if (!initializerInfo.value) {
                error(statement.initializer.expression, "Must return a value");
              }
              code.push(
                `;; Initializer for local ${statement.identifier} id=${statement.declaratorId}`,

                // For declarators we do not have "address" function we duplicate code here
                `local.get $ebp ;;  address, first part`,

                ...initializerInfo.value(),
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

            const expressionRegisterType = getTypenameRegister(
              returnExpressionInfo.type
            );

            if (
              expressionRegisterType &&
              expressionRegisterType === functionReturnsInRegister
            ) {
              if (!returnExpressionInfo.value) {
                error(
                  statement.expression,
                  `Internal error: Type ${returnExpressionInfo.type.type} must have value`
                );
              }
              code.push(...returnExpressionInfo.value());
              code.push(`local.set ${returnValueLocalName}`);
            } else {
              error(
                statement.expression,
                "This return type is not supported yet"
              );
            }
          }

          code.push(`br ${returnBrDepth} ;; Return`);
          returnFound = true;
        } else if (statement.type === "expression") {
          const info = getExpressionInfo(statement.expression);
          // Here we need only side effects
          if (info.value) {
            code.push(...info.value());
          } else if (info.address) {
            code.push(...info.address());
          } else {
            error(
              statement.expression,
              "Internal error: expression must have value or address"
            );
          }
          code.push("drop");
        } else if (statement.type === "compound-statement") {
          // Here is no need to create a block, but we do this just for simplicity
          code.push("block");
          code.push(
            ...createFunctionCodeForBlock(
              statement.body,
              returnBrDepth + 1,
              continueBrDepth ? continueBrDepth + 1 : null
            )
          );
          code.push("end");
        } else if (statement.type === "if") {
          const conditionInfo = getExpressionInfo(statement.condition);
          const conditionRegister = getTypenameRegister(conditionInfo.type);
          if (conditionRegister !== "i32") {
            error(
              statement.condition,
              "TODO: register change is not supported yet"
            );
          }
          if (!conditionInfo.value) {
            error(statement.condition, "Condition must have a value");
          }

          code.push(
            ...conditionInfo.value(),
            "if",
            ...createFunctionCodeForBlock(
              statementToCompoundStatementBody(statement.iftrue),
              returnBrDepth + 1,
              continueBrDepth ? continueBrDepth + 1 : null
            )
          );
          if (statement.iffalse) {
            code.push(
              "else",
              ...createFunctionCodeForBlock(
                statementToCompoundStatementBody(statement.iffalse),
                returnBrDepth + 1,
                continueBrDepth ? continueBrDepth + 1 : null
              )
            );
          }
          code.push("end");
        } else {
          error(statement, "TODO statement");
        }
      }

      return code;
    }

    const funcCode: WAInstuction[] = createFunctionCodeForBlock(
      func.body,
      0,
      null
    );

    const restoreEsp: WAInstuction[] = [...writeEspCode([`local.get $ebp`])];
    const returnValueInRegisterIfAny: WAInstuction[] = functionReturnsInRegister
      ? [`local.get ${returnValueLocalName}`]
      : [];

    const functionParamsDeclarations: WAInstuction[] = [];
    const functionParamsInitializers: WAInstuction[] = [];
    for (const param of func.declaration.typename.parameters) {
      if (param.type !== "declarator") {
        error(
          param,
          `Internal error: function must have declarator parameters`
        );
      }
      const paramRegisterType = getTypenameRegister(param.typename);
      if (!paramRegisterType) {
        error(param, "TODO: Currently this type of parameter is not supported");
      }
      functionParamsDeclarations.push(
        `  (param $P${param.declaratorId} ${paramRegisterType}) `
      );

      functionParamsInitializers.push(
        // Parameter address. They are always on stack
        // Load ebp here and add it to memoryoffset
        `local.get $ebp ;; Param ${param.identifier} ebp`,
        // Parameter value
        `local.get $P${param.declaratorId} ;; Param ${param.identifier} value`,

        // Parameters are aligned because they are on stack
        storeScalar(param.typename, paramRegisterType, param.memoryOffset, 2)
      );
    }

    const functionHeader =
      `(func $F${func.declaration.declaratorId} ` +
      functionParamsDeclarations.join(" ") +
      (functionReturnsInRegister
        ? ` (result ${functionReturnsInRegister})`
        : "") +
      `  (local $ebp i32)` +
      (functionReturnsInRegister
        ? `  (local ${returnValueLocalName} ${functionReturnsInRegister})`
        : "");

    return [
      `;; Function ${func.declaration.identifier} localSize=${inFuncAddress}`,
      functionHeader,

      ...readEspCode,
      `local.set $ebp ;; Save esp -> ebp`,

      ...writeEspCode([
        `local.get $ebp`,
        `i32.const ${inFuncAddress}`,
        `i32.add ;; Add all locals to esp`,
      ]),
      `;; Initialize params`,
      ...functionParamsInitializers,
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

  return {
    createFunctionCode,
  };
}
