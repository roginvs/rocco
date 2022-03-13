import { Typename } from "./parser.definitions";
import { assertNever } from "./assertNever";
import { RegisterType, WAInstuction } from "./emitter.definitions";

export function getRegisterForTypename(
  typename: Typename
): RegisterType | null {
  if (typename.type === "arithmetic") {
    if (
      typename.arithmeticType === "char" ||
      typename.arithmeticType === "short" ||
      typename.arithmeticType === "int"
    ) {
      return "i32" as const;
    } else if (typename.arithmeticType === "long long") {
      return "i64" as const;
    } else if (typename.arithmeticType === "float") {
      return "f32" as const;
    } else if (typename.arithmeticType === "double") {
      return "f64" as const;
    } else {
      assertNever(typename.arithmeticType);
    }
  } else if (typename.type === "pointer") {
    return "i32" as const;
  } else {
    // TODO: enums are in registers too
    return null;
  }
}

/*
 Memory structure:

0x0 - 0x4 : 4 bytes, reserved
..........: stack (starts from the top and grows downwards)
..........: 4 bytes, ESP_ADDRESS
..........: 4 bytes, HEAP_BEGIN_ADDRESS
..........: globals
..........: <maybe something reserved>
..........: heap starts here

 */
const STACK_SIZE = 0x10000;
export const ESP_ADDRESS = 4 + STACK_SIZE;
/**
 * It happened that top of the stack is right before global of ESP
 */
export const ESP_INITIAL_VALUE = ESP_ADDRESS;
export const HEAP_BEGIN_ADDRESS = ESP_ADDRESS + 4;
export const GLOBALS_BEGIN_ADDRESS = HEAP_BEGIN_ADDRESS + 4;

export const readEspCode: WAInstuction[] = [
  `i32.const ${ESP_ADDRESS} ;; Read $esp`,
  "i32.load offset=0 align=2 ;; Read $esp",
];
export const writeEspCode = (value: WAInstuction[]) => [
  `i32.const ${ESP_ADDRESS} ;; Prepare $esp write - address`,
  ...value,
  `i32.store offset=0 align=2 ;; Write $esp`,
];

/**
 * Returns values like \0a or \ff from number
 * number must be in 0-255 range
 */
function paddedHex(i: number) {
  const s = i.toString(16);
  return "\\" + (s.length === 2 ? s : "0" + s);
}
export const dataString = {
  int4(i: number) {
    const a = i & 0xff;
    const b = (i >> 8) & 0xff;
    const c = (i >> 16) & 0xff;
    const d = (i >> 24) & 0xff;
    return [a, b, c, d].map((i) => paddedHex(i)).join("");
  },
};
