import { Scanner } from "./scanner";
import {
  ARITHMETIC_TYPE as ARITHMETIC_TYPES,
  TypeQualifier,
  TYPE_QUALIFIERS,
  TypeSignedUnsigned,
  StorageClass,
  STORAGE_CLASSES,
} from "./scanner.func";
import {
  Typename,
  ExpressionNode,
  NodeLocator,
  DeclaratorNode,
} from "./parser.definitions";
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

  function isCurrentTokenAStorageClassSpecifier() {
    const token = scanner.current();
    const storageClassSpecifier = STORAGE_CLASSES.find((x) => x === token.type);
    return storageClassSpecifier;
  }
  function isCurrentTokenAFunctionSpecifier() {
    const token = scanner.current();
    return token.type === "inline" ? token.type : undefined;
  }

  function isCurrentTokenTypedefName(): Typename | undefined {
    // @TODO Here we need symbol table
    return undefined;
  }

  /**
   * Use this function in parsing cast-expression and sizeof
   */
  function isCurrentTokenLooksLikeSpecifierQualifierList() {
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

  function isCurrentTokenLooksLikeTypeName() {
    return isCurrentTokenLooksLikeSpecifierQualifierList();
  }

  function isCurrentTokenLooksLikeDeclarationSpecifier() {
    return isCurrentTokenLooksLikeSpecifierQualifierList() ||
      isCurrentTokenAStorageClassSpecifier() ||
      isCurrentTokenAFunctionSpecifier()
      ? true
      : false;
  }

  function isQualifiersListHaveDuplicates(qualifiers: TypeQualifier[]) {
    return (
      qualifiers.filter((s1, idx1) =>
        qualifiers.find((s2, idx2) => s1 === s2 && idx1 !== idx2)
      ).length > 0
    );
  }

  function readDeclarationSpecifiers() {
    // @TODO: Refactor me to be able to read "long long int"

    const qualifiers: TypeQualifier[] = [];

    let specifier: Typename | undefined = undefined;

    let signedUnsigned: TypeSignedUnsigned | undefined;

    let storageClassSpecifier: StorageClass | null = null;
    let functionSpecifier: "inline" | null = null;

    const tokenForLocator = scanner.current();

    while (true) {
      const qualifier = isCurrentTokenTypeQualifier();

      const token = scanner.current();

      const maybeArithmeticSpecifier = isCurrentTokenTypeArithmeticSpecifier();

      const maybeSpecifierFromSymbolTable = isCurrentTokenTypedefName();

      const maybeStorageClassSpecifier = isCurrentTokenAStorageClassSpecifier();

      const maybeFunctionSpecifier = isCurrentTokenAFunctionSpecifier();

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
          const: false,
        };
      } else if (maybeArithmeticSpecifier) {
        // @TODO Here we should update type if we see "long long"
        if (specifier) {
          throwError("Already have type specifier");
        }
        scanner.readNext();
        specifier = {
          type: "arithmetic",
          arithmeticType: maybeArithmeticSpecifier,
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
      } else if (maybeSpecifierFromSymbolTable) {
        if (specifier) {
          throwError("Already have specifier");
        }
        specifier = maybeSpecifierFromSymbolTable;
      } else if (maybeStorageClassSpecifier) {
        if (storageClassSpecifier) {
          throwError(
            `Already have storage class specifier ${storageClassSpecifier}`
          );
        }
        storageClassSpecifier = maybeStorageClassSpecifier;
      } else if (maybeFunctionSpecifier) {
        if (functionSpecifier) {
          throwError(`Already have function specifier`);
        }
        functionSpecifier = maybeFunctionSpecifier;
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

    return { specifier, storageClassSpecifier, functionSpecifier };
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
   * We also can defer some checks, for example if we got abstract-declarator, but
   *   with storage class
   *
   */
  type TypeCoreless = (base: Typename) => Typename;
  type TypeOrDeclaratorCoreless =
    | {
        abstract: true;
        chain: (base: Typename) => Typename;
      }
    | {
        abstract: false;
        chain: (base: Typename) => DeclaratorNode;
      };

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

  function readAbstractDeclaratorOrDeclaratorCoreless(): TypeOrDeclaratorCoreless {
    const afterPointersCoreless = readPointersCoreless();

    const directAbstractDeclaratorOrAbstractDeclaratorCoreless = readDirectAbstractDeclaratorOrDirectDeclaratorCoreless();

    // Chain is the same
    if (directAbstractDeclaratorOrAbstractDeclaratorCoreless.abstract) {
      return {
        abstract: true,
        chain: (node) =>
          directAbstractDeclaratorOrAbstractDeclaratorCoreless.chain(
            afterPointersCoreless(node)
          ),
      };
    } else {
      return {
        abstract: false,
        chain: (node) =>
          directAbstractDeclaratorOrAbstractDeclaratorCoreless.chain(
            afterPointersCoreless(node)
          ),
      };
    }
  }

  function readDirectAbstractDeclaratorOrDirectDeclaratorCoreless(): TypeOrDeclaratorCoreless {
    let left: TypeCoreless = (node) => node;

    let nestedAbstractDeclaratorOrDeclaratorOrIdentifier: TypeOrDeclaratorCoreless | null = null;

    while (true) {
      const token = scanner.current();

      const isAbstractDeclarator =
        !nestedAbstractDeclaratorOrDeclaratorOrIdentifier ||
        nestedAbstractDeclaratorOrDeclaratorOrIdentifier.abstract;

      if (token.type === "(") {
        scanner.readNext();

        const firstTokenInsideBracket = scanner.current();

        if (
          // We already have "identifier" or "(declarator)" or "(abstract-declarator)"
          nestedAbstractDeclaratorOrDeclaratorOrIdentifier ||
          // Or, it is () which is a function call
          firstTokenInsideBracket.type === ")" ||
          // So, now it is possible to be:
          //   - nested declarator in direct-declarator
          //   - nested abstract-declarator in direct-abstract-declarator
          //   - direct-abstract-declarator which declares function
          //  "declarator" and "direct-declarator" can not start with declaration-specifier
          isCurrentTokenLooksLikeDeclarationSpecifier()
        ) {
          // @TODO: A function call

          // Read "parameter-type-list" or "identifier-list" using isAbstractDeclarator

          if (firstTokenInsideBracket.type !== ")") {
            throwError("Not supported yet");
          }
          scanner.readNext();
        } else {
          // Not a func call, but nested abstract-declarator or declarator
          nestedAbstractDeclaratorOrDeclaratorOrIdentifier = readAbstractDeclaratorOrDeclaratorCoreless();

          if (scanner.current().type !== ")") {
            throwError("Expected )");
          }
          scanner.readNext();
        }
      } else if (token.type === "[") {
        scanner.readNext();

        // @TODO: Check other productions for direct-declarator,
        // like with "static" keyword or with "type-qualifier-list"

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
            const: true,
            size: size,
            elementsTypename: node,
          };
          locator.set(me, {
            ...token,
            length: closing.pos - token.pos,
          });
          return savedLeft(me);
        };
      } else if (token.type === "identifier") {
        // Aha, direct-declarator with identifier
        // Must be null because we checked in above
        nestedAbstractDeclaratorOrDeclaratorOrIdentifier = {
          abstract: false,
          chain: (typeNode) => ({
            type: "declarator",
            // Unknown yet
            functionSpecifier: null,
            // Unknown yet
            storageSpecifier: null,
            identifier: token.text,
            typename: typeNode,
          }),
        };
        scanner.readNext();
      } else {
        if (!nestedAbstractDeclaratorOrDeclaratorOrIdentifier) {
          return {
            abstract: true,
            chain: (node) => left(node),
          };
        } else {
          const saved = nestedAbstractDeclaratorOrDeclaratorOrIdentifier;
          if (saved.abstract) {
            return {
              abstract: true,
              chain: (node) => saved.chain(left(node)),
            };
          } else {
            return {
              abstract: false,
              chain: (node) => saved.chain(left(node)),
            };
          }
        }
      }
    }
  }

  function readTypeName() {
    const {
      specifier: baseSpecifier,
      storageClassSpecifier,
      functionSpecifier,
    } = readDeclarationSpecifiers();

    if (storageClassSpecifier) {
      throwError("storage-class-specifier is not allowed in typeName");
    }
    if (functionSpecifier) {
      throwError("function-specifier is not allowed in typeName");
    }

    const abstractDeclaratorOrDeclaratorCoreless = readAbstractDeclaratorOrDeclaratorCoreless();

    if (!abstractDeclaratorOrDeclaratorCoreless.abstract) {
      throwError("Non abstract declarator is not expected here");
    }

    const typename = abstractDeclaratorOrDeclaratorCoreless.chain(
      baseSpecifier
    );

    return typename;
  }

  return {
    readTypeName,
    isCurrentTokenLooksLikeTypeName,
  };
}
