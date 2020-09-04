import { Typename } from "./parser.definitions";
import { assertNever } from "./assertNever";
import { RegisterType, WAInstuction } from "./emitter.definitions";

export function typenameToRegister(typename: Typename): RegisterType | null {
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
