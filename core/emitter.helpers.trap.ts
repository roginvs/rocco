import { FunctionTypename } from "./parser.definitions";
import { WAInstuction } from "./emitter.definitions";
import { FunctionSignatures } from "./emitter.helpers.functionsignature";

const trapFunctionType: FunctionTypename = {
  type: "function",
  returnType: {
    type: "void",
    const: true,
  },
  const: true,
  haveEndingEllipsis: false,
  parameters: [],
};

export const trapFunctionName = "$null";
export function getTrapFunctionCode(
  functionSignatures: FunctionSignatures
): WAInstuction[] {
  const waTypeName = functionSignatures.getFunctionTypeName(trapFunctionType);
  return [`(func ${trapFunctionName} (type ${waTypeName})`, `unreachable`, `)`];
}
