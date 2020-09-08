import { FunctionTypename } from "./parser.definitions";
import { getRegisterForTypename } from "./emitter.utils";
import { RegisterType } from "./emitter.definitions";
import { type } from "os";

function registerToShortname(register: RegisterType) {
  return {
    i32: "i",
    i64: "j",
    f32: "f",
    f64: "d",
  }[register];
}

/** Exported only for autotests, do not use it */
export function generateFunctionWaTypeName(func: FunctionTypename) {
  const returnRegister = getRegisterForTypename(func.returnType);

  const returnTypeNamePart =
    func.returnType.type === "void"
      ? "v"
      : returnRegister
      ? registerToShortname(returnRegister)
      : null;

  if (!returnTypeNamePart) {
    // No locator here
    throw new Error("Return of non-register value is not supported yet");
  }
  const waTypeDefinitionResult = returnRegister
    ? ` (result ${returnRegister})`
    : "";

  let waTypeDefinitionParams = "";

  let waTypeName = "$FUNCSIG" + returnTypeNamePart;
  for (const param of func.parameters) {
    const paramTypename = param.type === "declarator" ? param.typename : param;

    const paramRegister = getRegisterForTypename(paramTypename);
    if (!paramRegister) {
      throw new Error(
        "Parameters with non-register values is not supported yet"
      );
    }

    const paramRegisterTypeNamePart = registerToShortname(paramRegister);

    waTypeName += paramRegisterTypeNamePart;
    waTypeDefinitionParams += ` ${paramRegister}`;
  }

  if (func.haveEndingEllipsis) {
    throw new Error("'...' is not implemened yed");
  }

  const waTypeDefinition =
    "(func" +
    (waTypeDefinitionParams ? ` (param${waTypeDefinitionParams})` : "") +
    waTypeDefinitionResult +
    ")";

  return [waTypeName, waTypeDefinition];
}

export class FunctionSignature {
  /**
   * A map, something like this
   *
   * $FUNCSIG$iij -> (func (param i32 i64) (result i32)))
   */
  private seenFunctionTypes = new Map<string, string>();

  getFunctionTypeName(func: FunctionTypename) {
    const waTypeName = generateFunctionWaTypeName(func);

    // asdasd
  }
}
