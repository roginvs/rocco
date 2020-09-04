import { Typename } from "./parser.definitions";
import { assertNever } from "./assertNever";
import { RegisterType, WAInstuction } from "./emitter.definitions";

export function storeScalar(
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

export function loadScalar(
  t: Typename,
  toRegister: RegisterType,
  offset = 0,
  alignment = 2
): WAInstuction {
  const offsetAlign =
    (offset !== 0 ? ` offset=${offset}` : "") +
    (alignment !== 0 ? ` align=${alignment}` : "");

  if (toRegister !== "i32") {
    throw new Error("Not supported yet");
  }
  if (t.type === "pointer") {
    return `i32.load ${offsetAlign}`;
  }

  if (t.type !== "arithmetic") {
    throw new Error("Internal error");
  }
  if (t.arithmeticType === "int") {
    return `i32.load offset=${offset} ${offsetAlign} ;; readArithmetic int`;
  } else if (t.arithmeticType === "char") {
    if (t.signedUnsigned === "signed") {
      return `i32.load8_s ${offsetAlign}`;
    } else {
      return `i32.load8_u ${offsetAlign} `;
    }
  }
  throw new Error("Internal error or not suppored yet");
}
