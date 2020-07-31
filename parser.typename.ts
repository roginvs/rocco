import { Scanner } from "./scanner";
import {
  ARITHMETIC_TYPE as ARITHMETIC_TYPES,
  TypeQualifier,
  TYPE_QUALIFIERS,
  TypeSignedUnsigned,
} from "./scanner.func";
import { Typename, ExpressionNode, NodeLocator } from "./parser.definitions";
import { ParserError } from "./error";

export interface TypeParserDependencies {
  readAssignmentExpression: () => ExpressionNode;
}
export function createTypeParser(
  scanner: Scanner,
  locator: NodeLocator,
  expressionReader: TypeParserDependencies
) {
  function throwError(info: string): never {
    throw new ParserError(`${info}`, scanner.current());
  }

  function isCurrentTokenTypeQualifier() {
    const token = scanner.current();
    const qualifier = TYPE_QUALIFIERS.find((x) => token.type === x);
    return qualifier;
  }

  function isCurrentTokenTypeVoid() {
    const token = scanner.current();
    return token.type === "void" ? token.type : undefined;
  }
  function isCurrentTokenTypeArithmeticSpecifier() {
    const token = scanner.current();
    const arithmeticType = ARITHMETIC_TYPES.find((x) => x === token.type);
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
      token.type === "signed" ||
      token.type === "unsigned" ||
      token.type === "struct" ||
      token.type === "union" ||
      token.type === "enum" ||
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

    const tokenForLocator = scanner.current();

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
          const: false,
          signedUnsigned: null,
        };
      } else if (token.type === "signed" || token.type === "unsigned") {
        if (signedUnsigned) {
          throwError("Already have signed/unsigned");
        }
        scanner.readNext();
        signedUnsigned = token.type;
      } else if (token.type === "struct") {
        throwError("Not implemented yet");
      } else if (token.type === "union") {
        throwError("Not implemented yet");
      } else if (token.type === "enum") {
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

    locator.set(specifier, {
      ...tokenForLocator,
      length: scanner.current().pos - tokenForLocator.pos,
    });

    return specifier;
  }

  /*
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
  */

  /**
   * Imagine this as nullable Typename, a chain of nested type where
   *   last part is null because it is unknown at this moment.
   * Example: When we read "char (*) ...", at the moment in parentheses
   *   we know it will be a pointer, but we do not know yet what will it point to,
   *   will it be just "char" or "char[]" or "char()"
   *
   * We have two operation: insert or append into that chain
   *
   */
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
      locator.set(me, {
        ...token,
        length: scanner.current().pos - token.pos,
      });
      const nextPart = nextPartCoreless(me);
      return nextPart;
    };

    return myCoreless;
  }

  function readAbstractDeclaratorCoreless(): TypeCoreless {
    const afterPointersCoreless = readPointersCoreless();

    const directAbstractDeclaratorCoreless = readDirectAbstractDeclaratorCoreless();

    return (node) => {
      const afterPointers = afterPointersCoreless(node);
      const directAbstract = directAbstractDeclaratorCoreless(afterPointers);

      return directAbstract;
    };
  }

  function readDirectAbstractDeclaratorCoreless(): TypeCoreless {
    let left: TypeCoreless = (node) => node;

    let nestedAbstractDeclarator: TypeCoreless | null = null;

    while (true) {
      const token = scanner.current();

      if (token.type === "(") {
        scanner.readNext();

        const nextToken = scanner.current();
        if (nextToken.type === ")" || isCurrentTokenLooksLikeTypeName()) {
          scanner.readNext();
          // we have a func call
          // @TODO
        } else {
          if (nestedAbstractDeclarator) {
            throwError("Already have nested abstract-declarator");
          }
          // Not a func call, but nested abstract-declarator
          nestedAbstractDeclarator = readAbstractDeclaratorCoreless();

          if (scanner.current().type !== ")") {
            throwError("Expected )");
          }
          scanner.readNext();
        }
      } else if (token.type === "[") {
        scanner.readNext();

        let size: ExpressionNode | "*" | null = null;
        if (scanner.current().type === "*") {
          scanner.makeControlPoint();
          scanner.readNext();
          const nextSymbolIsClosingSquareBrace = scanner.current().type === "]";
          scanner.rollbackControlPoint();

          if (nextSymbolIsClosingSquareBrace) {
            size = "*";
            scanner.readNext();
          } else {
            size = expressionReader.readAssignmentExpression();
          }
        } else if (scanner.current().type !== "]") {
          size = expressionReader.readAssignmentExpression();
        }

        const closing = scanner.current();
        if (closing.type !== "]") {
          throwError("Expected ]");
        }
        scanner.readNext();

        const savedLeft = left;

        left = (node) => {
          const me: Typename = {
            type: "array",
            size: size,
            elementsTypename: node,
          };
          locator.set(me, {
            ...token,
            length: closing.pos - token.pos,
          });
          return savedLeft(me);
        };
      } else {
        return (node) => {
          const tree = left(node);

          if (nestedAbstractDeclarator) {
            const nestedTree = nestedAbstractDeclarator(tree);
            return nestedTree;
          } else {
            return tree;
          }
        };
      }
    }
  }

  function readTypeName() {
    const base = readSpecifierQualifierList();

    const abstractDeclaratorCoreless = readAbstractDeclaratorCoreless();

    const typename = abstractDeclaratorCoreless(base);

    return typename;
  }

  return {
    readTypeName,
    isCurrentTokenLooksLikeTypeName,
  };
}
