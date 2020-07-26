import { Scanner } from "./scanner";
import {
  ARITHMETIC_TYPE as ARITHMETIC_TYPES,
  Punctuator,
  BinaryOperator,
  Token,
  TypeQualifier,
  TYPE_QUALIFIERS,
  TypeSignedUnsigned,
  ArithmeticType,
} from "./scanner.func";

export type Typename =
  | { type: "void" }
  | {
      type: "arithmetic";
      arithmeticType: ArithmeticType;
      signedUnsigned?: TypeSignedUnsigned;
      const?: boolean;
    }
  | {
      type: "struct";
      const?: boolean;
      // @TODO
    }
  | {
      type: "enum";
      const?: boolean;
      // @TODO
    };

export function createTypeParser(scanner: Scanner) {
  function throwError(info: string): never {
    throw new Error(
      `${info} at line=${scanner.current().line} pos=${scanner.current().pos}`
    );
  }

  function isCurrentTokenTypeQualifier() {
    const token = scanner.current();
    const qualifier = TYPE_QUALIFIERS.find(
      (x) => token.type === "keyword" && token.keyword === x
    );
    return qualifier;
  }

  function isCurrentTokenTypeVoid() {
    const token = scanner.current();
    return token.type === "keyword" && token.keyword === "void"
      ? token.keyword
      : undefined;
  }
  function isCurrentTokenTypeArithmeticSpecifier() {
    const token = scanner.current();
    const arithmeticType = ARITHMETIC_TYPES.find(
      (x) => token.type === "keyword" && x === token.keyword
    );
    return arithmeticType;
  }

  function isCurrentTokenTypedefName(): Typename | undefined {
    // @TODO Here we need symbol table
    return undefined;
  }

  /**
   * Use this function in parsing cast-expression and sizeof
   */
  function isCurrentTokenLooksLikeTypeName() {
    const token = scanner.current();

    const isIt =
      isCurrentTokenTypeVoid() ||
      isCurrentTokenTypeArithmeticSpecifier() ||
      isCurrentTokenTypeQualifier() ||
      (token.type === "keyword" && token.keyword === "signed") ||
      (token.type === "keyword" && token.keyword === "unsigned") ||
      (token.type === "keyword" && token.keyword === "struct") ||
      (token.type === "keyword" && token.keyword === "union") ||
      (token.type === "keyword" && token.keyword === "enum") ||
      isCurrentTokenTypedefName()
        ? true
        : false;

    return isIt;
  }

  function readSpecifierQualifierList() {
    // @TODO: Refactor me to be able to read "long long int"

    const qualifiers: TypeQualifier[] = [];

    let specifier: Typename | undefined = undefined;

    let signedUnsigned: TypeSignedUnsigned | undefined;

    while (true) {
      const qualifier = isCurrentTokenTypeQualifier();

      const token = scanner.current();

      const arithmeticSpecifier = isCurrentTokenTypeArithmeticSpecifier();

      if (qualifier) {
        scanner.readNext();
        qualifiers.push(qualifier);
      } else if (isCurrentTokenTypeVoid()) {
        if (specifier) {
          throwError("Already have type specifier");
        }
        scanner.readNext();
        specifier = {
          type: "void",
        };
      } else if (arithmeticSpecifier) {
        // @TODO Here we should update type if we see "long long"
        if (specifier) {
          throwError("Already have type specifier");
        }
        scanner.readNext();
        specifier = {
          type: "arithmetic",
          arithmeticType: arithmeticSpecifier,
        };
      } else if (
        token.type === "keyword" &&
        (token.keyword === "signed" || token.keyword === "unsigned")
      ) {
        if (signedUnsigned) {
          throwError("Already have signed/unsigned");
        }
        scanner.readNext();
        signedUnsigned = token.keyword;
      } else if (token.type === "keyword" && token.keyword === "struct") {
        throwError("Not implemented yet");
      } else if (token.type === "keyword" && token.keyword === "union") {
        throwError("Not implemented yet");
      } else if (token.type === "keyword" && token.keyword === "enum") {
        throwError("Not implemented yet");
      } else {
        break;
      }
    }

    if (!specifier) {
      throwError("Expect specifier");
    }

    if (signedUnsigned) {
      if (specifier.type !== "arithmetic") {
        throwError("Expecting arithmetic type for signed/unsigned");
      }
      specifier.signedUnsigned = signedUnsigned;
    }

    if (qualifiers.indexOf("const") > -1) {
      if (specifier.type === "void") {
        throwError("Unable to add const for void");
      }
      specifier.const = true;
    }

    if (
      qualifiers.filter((s1, idx1) =>
        qualifiers.find((s2, idx2) => s1 === s2 && idx1 !== idx2)
      ).length > 0
    ) {
      throwError("Got duplicated qualifiers");
    }

    return specifier;
  }

  function readTypeName() {
    const base = readSpecifierQualifierList();

    // @TODO

    return base;
  }

  return {
    readTypeName,
    isCurrentTokenLooksLikeTypeName,
  };
}
