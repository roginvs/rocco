import { Typename } from "./parser.definitions";
import { assertNever } from "./assertNever";
import { RegisterType, WAInstuction } from "./emitter.definitions";

function addOffsetAlign(
  instruction: WAInstuction,
  offset: number,
  align: number,
  maxAlign: number
) {
  const realAlign = Math.min(align, maxAlign);
  return (
    instruction +
    ((offset !== 0 ? ` offset=${offset}` : "") +
      (realAlign !== 0 ? ` align=${realAlign}` : ""))
  );
}

export function storeScalar(
  typename: Typename,
  fromRegister: RegisterType,
  offset = 0,
  align = 0
): WAInstuction {
  if (typename.type === "arithmetic") {
    if (typename.arithmeticType === "char") {
      if (fromRegister !== "i32" && fromRegister !== "i64") {
        throw new Error(
          `Internal error: unable to save char from ${fromRegister} register`
        );
      }
      return addOffsetAlign(`${fromRegister}.store8`, offset, align, 0);
    } else if (typename.arithmeticType === "short") {
      if (fromRegister !== "i32" && fromRegister !== "i64") {
        throw new Error(
          `Internal error: unable to save short from ${fromRegister} register`
        );
      }
      return addOffsetAlign(`${fromRegister}.store16`, offset, align, 1);
    } else if (typename.arithmeticType === "int") {
      if (fromRegister === "i32") {
        return addOffsetAlign(`i32.store`, offset, align, 2);
      } else if (fromRegister === "i64") {
        return addOffsetAlign(`i64.store32`, offset, align, 2);
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
      return addOffsetAlign(`i64.store`, offset, align, 2);
    } else if (
      typename.arithmeticType === "double" ||
      typename.arithmeticType === "float"
    ) {
      throw new Error("TOOD: Store float/double");
    } else {
      assertNever(typename.arithmeticType);
    }
  } else if (typename.type === "pointer") {
    return addOffsetAlign(`i32.store`, offset, align, 2);
  }
  throw new Error(
    `Wrong usage, expecting only scalar types but got type=${typename.type}`
  );
}

export function loadScalar(
  t: Typename,
  toRegister: RegisterType,
  offset = 0,
  alignment = 0
): WAInstuction {
  if (toRegister !== "i32") {
    throw new Error("Not supported yet");
  }
  if (t.type === "pointer") {
    return addOffsetAlign(`i32.load`, offset, alignment, 2);
  }

  if (t.type !== "arithmetic") {
    throw new Error("Internal error");
  }
  if (t.arithmeticType === "int") {
    return (
      addOffsetAlign(`i32.load`, offset, alignment, 2) + `;; readArithmetic int`
    );
  } else if (t.arithmeticType === "char") {
    if (t.signedUnsigned === "signed") {
      return (
        addOffsetAlign(`i32.load8_s`, offset, alignment, 0) +
        `;; readArithmetic signed chat`
      );
    } else {
      return (
        addOffsetAlign(`i32.load8_u`, offset, alignment, 0) +
        `;; readArithmetic signed chat`
      );
    }
  }
  throw new Error("Internal error or not suppored yet");
}
