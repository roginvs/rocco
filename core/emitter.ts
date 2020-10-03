import { TranslationUnit, Node } from "./parser.definitions";

import { WAInstuction } from "./emitter.definitions";
import {
  writeEspCode,
  readEspCode,
  ESP_ADDRESS,
  dataString,
} from "./emitter.utils";
import { createHelpers } from "./emitter.helpers";
import { createExpressionAndTypes } from "./emitter.expressionsandtypes";
import { createFunctionCodeGenerator } from "./emitter.functionscode";
import { getTrapFunctionCode } from "./emitter.helpers.trap";

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

  const { createFunctionCode } = createFunctionCodeGenerator(
    helpers,
    getTypeSize,
    getExpressionInfo
  );

  // Initial step: assign global memory
  let memoryOffsetForGlobals = 8; // 4 for move from 0 address, and 0x4 for esp

  let functionIdAddress = 1;
  const globalDataInitializers: WAInstuction[] = [];
  for (const declarationId of unit.declarations) {
    const declaration = getDeclaration(declarationId);
    if (declaration.storageSpecifier === "typedef") {
      continue;
    }

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
    if (size.type !== "static") {
      error(declaration, `Globals must have known size`);
    }
    if (memoryOffsetForGlobals % 4 !== 0) {
      throw new Error("Self-check failed, wrong alignment");
    }
    declaration.memoryOffset = memoryOffsetForGlobals;
    declaration.memoryIsGlobal = true;
    memoryOffsetForGlobals += size.value;
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
        if (
          initializerExpressionInfo.type.arithmeticType !== "int" &&
          initializerExpressionInfo.type.arithmeticType !== "char"
        ) {
          error(
            declaration.initializer.expression,
            "TODO: Only int or char is supported for initializers"
          );
        }

        globalDataInitializers.push(
          `;; Initializer for global ${declaration.identifier} id=${declaration.declaratorId}`,
          `(data (i32.const ${declaration.memoryOffset}) "${dataString.int4(
            initializerExpressionInfo.staticValue
          )}")`
        );
      }
    }
  }

  /*
  console.info(
    `Globals size = ${
      memoryOffsetForGlobals - 4
    }, usable memory from ${memoryOffsetForGlobals}`
  );
  */

  // first function is trap function

  const functionsCode: WAInstuction[] = [];
  // Now create functions
  for (const statement of unit.body) {
    if (statement.type === "function-declaration") {
      const lines = createFunctionCode(statement);
      functionsCode.push(...lines);
    }
  }

  const setupEspData: WAInstuction[] = [
    `;; Initializer for ESP`,
    `(data (i32.const ${ESP_ADDRESS}) "${dataString.int4(
      memoryOffsetForGlobals
    )}")`,
  ];

  const debugHelpers: WAInstuction[] = [
    `(func (export "_debug_get_esp") (result i32)`,
    ...readEspCode,
    ")",
  ];

  const trapFunctionCode = getTrapFunctionCode(helpers.functionSignatures);

  const functionTypes = helpers.functionSignatures.getTypesWAInstructions();

  const functionTable: WAInstuction[] = [
    `(table ${functionIdAddress} ${functionIdAddress} anyfunc) ;; min and max length`,
    `(elem (i32.const 0) $null ` +
      unit.body
        .map((statement) => {
          if (statement.type !== "function-declaration") {
            return "";
          }
          return ` $F${statement.declaration.declaratorId}`;
        })
        .join("") +
      ")",
  ];

  const moduleCode: WAInstuction[] = [
    "(module",
    `(import "js" "memory" (memory 0))`,

    ...functionTypes,

    ...functionTable,

    //'(global $esp (import "js" "esp") (mut i32))',
    //"(global $esp (mut i32))",

    // Functions are in order of definition (not declaration?)
    ...trapFunctionCode,
    ...functionsCode,

    ...setupEspData,
    ...globalDataInitializers,

    ...debugHelpers,
    ")",
  ];

  return {
    warnings,
    moduleCode,
  };
}
