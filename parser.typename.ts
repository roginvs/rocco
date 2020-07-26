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
import { ExpressionNode } from "./parser.expression";

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
    }
  | {
      type: "pointer";
      const?: boolean;
      pointsTo: Typename;
    }
  | {
      type: "array";
      elementsTypename: Typename;
      size?: ExpressionNode;
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

  function isQualifiersListHaveDuplicates(qualifiers: TypeQualifier[]) {
    return (
      qualifiers.filter((s1, idx1) =>
        qualifiers.find((s2, idx2) => s1 === s2 && idx1 !== idx2)
      ).length > 0
    );
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

    if (isQualifiersListHaveDuplicates(qualifiers)) {
      throwError("Got duplicated qualifiers");
    }

    return specifier;
  }

  function readPointers(base: Typename): Typename {
    const token = scanner.current();
    if (token.type !== "*") {
      return base;
    }
    scanner.readNext();

    const pointer: Typename = {
      type: "pointer",
      const: false,
      pointsTo: base,
    };

    const qualifiers: TypeQualifier[] = [];
    while (true) {
      const qualifier = isCurrentTokenTypeQualifier();
      if (qualifier) {
        scanner.readNext();
        qualifiers.push(qualifier);
      } else {
        break;
      }
    }

    if (isQualifiersListHaveDuplicates(qualifiers)) {
      throwError("Qualifiers have duplicates");
    }

    if (qualifiers.indexOf("const") > -1) {
      pointer.const = true;
    }

    return readPointers(pointer);
  }

  function readDirectAbstractDeclarator(base: Typename) {
    //asd @TODO
    return base;
  }

  function readAbstractDeclarator(base: Typename): Typename {
    const afterPointers = readPointers(base);

    // @TODO
    return readDirectAbstractDeclarator(afterPointers);
  }

  type TypeCoreless = (base: Typename) => Typename;

  function readPointersCoreless(): TypeCoreless {
    const token = scanner.current();
    if (token.type !== "*") {
      return (base) => base;
    }
    scanner.readNext();

    const qualifiers: TypeQualifier[] = [];
    while (true) {
      const qualifier = isCurrentTokenTypeQualifier();
      if (qualifier) {
        scanner.readNext();
        qualifiers.push(qualifier);
      } else {
        break;
      }
    }

    if (isQualifiersListHaveDuplicates(qualifiers)) {
      throwError("Qualifiers have duplicates");
    }
    const isConst = qualifiers.indexOf("const") > -1;

    const nextPartCoreless = readPointersCoreless();

    const myCoreless: TypeCoreless = (base) => {
      const me: Typename = {
        type: "pointer",
        const: isConst,
        pointsTo: base,
      };
      const nextPart = nextPartCoreless(me);
      return nextPart;
    };

    return myCoreless;
  }

  function readAbstractDeclaratorFabric(): TypeCoreless {
    const afterPointersFabric = readPointersCoreless();

    const directAbstractDeclaratorFabric = readDirectAbstractDeclaratorFabric();

    return (node) => {
      const afterPointers = afterPointersFabric(node);
      const directAbstract = directAbstractDeclaratorFabric(afterPointers);

      return directAbstract;
    };
  }

  function readDirectAbstractDeclaratorFabric(): TypeCoreless {
    const token = scanner.current();
    if (token.type === "(") {
      scanner.readNext();

      const nextToken = scanner.current();
      if (nextToken.type === ")") {
        scanner.readNext();
        // we have a func call
        // @TODO
      } else {
        // Not a func call, but nested abstract-declarator
        const abstractDeclaratorFabric = readAbstractDeclaratorFabric();

        if (scanner.current().type !== ")") {
          throwError("Expected )");
        }
        scanner.readNext();

        const nextFabric = readDirectAbstractDeclaratorFabric();
        return (node) => {
          const childs = nextFabric(node);
          const inParentheses = abstractDeclaratorFabric(childs);
          return inParentheses;
        };
      }
      return (node) => node;
    } else if (token.type === "[") {
      scanner.readNext();

      // TODO TODO
      const nextToken = scanner.current();
      if (nextToken.type !== "const") {
        throw new Error("TODO");
      }
      scanner.readNext();
      const sizeNode = {
        type: "const" as const,
        subtype: "int" as const,
        value: nextToken.value,
      };

      const closing = scanner.current();
      if (closing.type !== "]") {
        throwError("Expected ]");
      }
      scanner.readNext();

      const nextFabric = readDirectAbstractDeclaratorFabric();

      return (node) => {
        const childs = nextFabric(node);
        return {
          type: "array",
          size: sizeNode,
          elementsTypename: childs,
        };
      };
    } else {
      return (node) => node;
    }
  }

  function readTypeName() {
    const base = readSpecifierQualifierList();

    const abstractDeclaratorFabric = readAbstractDeclaratorFabric();

    const typename = abstractDeclaratorFabric(base);

    return typename;
  }

  return {
    readTypeName,
    isCurrentTokenLooksLikeTypeName,
  };
}
