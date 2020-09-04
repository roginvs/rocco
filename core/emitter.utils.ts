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

export function storeScalarType(
  typename: Typename,
  fromRegister: RegisterType,
  offset = 0,
  align = 0
): WAInstuction {
  const offsetAlign =
    (offset !== 0 ? ` offset=${offset}` : "") +
    (align !== 0 ? ` align=${align}` : "");
  if (typename.type === "arithmetic") {
    if (typename.arithmeticType === "char") {
      if (fromRegister !== "i32" && fromRegister !== "i64") {
        throw new Error(
          `Internal error: unable to save char from ${fromRegister} register`
        );
      }
      return `${fromRegister}.store8 ${offsetAlign}`;
    } else if (typename.arithmeticType === "short") {
      if (fromRegister !== "i32" && fromRegister !== "i64") {
        throw new Error(
          `Internal error: unable to save short from ${fromRegister} register`
        );
      }
      return `${fromRegister}.store16 ${offsetAlign}`;
    } else if (typename.arithmeticType === "int") {
      if (fromRegister === "i32") {
        return `i32.store ${offsetAlign}`;
      } else if (fromRegister === "i64") {
        return `i64.store32 ${offsetAlign}`;
      } else {
        throw new Error(
          `Internal error: unable to save int from ${fromRegister} register`
        );
      }
    } else if (typename.arithmeticType === "long long") {
      if (fromRegister !== "i64") {
        throw new Error(
          `Internal error: unable to save longlong from ${fromRegister} register`
        );
      }
      return `i64.store ${offsetAlign}`;
    } else if (
      typename.arithmeticType === "double" ||
      typename.arithmeticType === "float"
    ) {
      throw new Error("TOOD: Store float/double");
    } else {
      assertNever(typename.arithmeticType);
    }
  } else if (typename.type === "pointer") {
    return `i32.store ${offsetAlign}`;
  }
  throw new Error(
    `Wrong usage, expecting only scalar types but got type=${typename.type}`
  );
}
