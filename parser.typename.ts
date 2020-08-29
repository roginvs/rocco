import { Scanner } from "./scanner";
import {
  TYPE_SPECIFIERS_ARITHMETIC,
  TypeQualifier,
  TYPE_QUALIFIERS,
  TypeSignedUnsigned,
  StorageClass,
  STORAGE_CLASSES,
  TYPE_SPECIFIERS_UNDERSCORE,
} from "./scanner.func";
import {
  Typename,
  ExpressionNode,
  NodeLocator,
  DeclaratorNode,
  IdentifierNode,
} from "./parser.definitions";
import { ParserError } from "./error";
import { type } from "os";
import { SymbolTable } from "./parser.symboltable";

export interface TypeParserDependencies {
  readAssignmentExpression: () => ExpressionNode;
}
export function createTypeParser(
  scanner: Scanner,
  locator: NodeLocator,
  expressionReader: TypeParserDependencies,
  symbolTable: SymbolTable
) {
  function throwError(info: string): never {
    // console.info(info, scanner.current());
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
    const arithmeticType = TYPE_SPECIFIERS_ARITHMETIC.find(
      (x) => x === token.type
    );
    return arithmeticType;
  }
  function isCurrentTokenTypeUnderscoreSpecifier() {
    const token = scanner.current();
    const arithmeticType = TYPE_SPECIFIERS_UNDERSCORE.find(
      (x) => x === token.type
    );
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
    const token = scanner.current();
    if (token.type !== "identifier") {
      return undefined;
    }

    // This call adds this node into cache, but it is useless thing
    // We add this type definition directly into type node
    // Maybe this is wrong
    const symbolTableEntry = symbolTable.lookupInScopes(token.text);
    if (!symbolTableEntry) {
      return undefined;
    }
    if (symbolTableEntry.storageSpecifier !== "typedef") {
      return undefined;
    }
    return symbolTableEntry.typename;
  }

  /**
   * Use this function in parsing cast-expression and sizeof
   */
  function isCurrentTokenLooksLikeSpecifierQualifierList() {
    const token = scanner.current();

    const isIt =
      isCurrentTokenTypeVoid() ||
      isCurrentTokenTypeArithmeticSpecifier() ||
      isCurrentTokenTypeUnderscoreSpecifier() ||
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

  function isCurrentTokenLooksLikeDeclarationSpecifiers() {
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
    const qualifiers: TypeQualifier[] = [];

    let specifier: Typename | undefined = undefined;
    let allowArithmeticTypeModification = true;

    let signedUnsigned: TypeSignedUnsigned | undefined;

    let storageClassSpecifier: StorageClass | null = null;
    let functionSpecifier: "inline" | null = null;

    const tokenForLocator = scanner.current();

    while (true) {
      const token = scanner.current();

      const qualifier = isCurrentTokenTypeQualifier();

      const maybeArithmeticSpecifier = isCurrentTokenTypeArithmeticSpecifier();

      const maybeUnderscoreSpecifier = isCurrentTokenTypeUnderscoreSpecifier();

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
        allowArithmeticTypeModification = false;
      } else if (maybeArithmeticSpecifier) {
        scanner.readNext();

        if (specifier) {
          if (specifier.type !== "arithmetic") {
            throwError("Already have non arithmetic type specifier");
          }
          if (!allowArithmeticTypeModification) {
            throwError("Not allowed to add specifiers to this type");
          }

          throwError("TODO: Add 'long long' and others, modify specifier");
        } else {
          specifier = {
            type: "arithmetic",
            arithmeticType:
              maybeArithmeticSpecifier === "long"
                ? "int"
                : maybeArithmeticSpecifier,
            const: false,
            signedUnsigned: null,
          };
        }
      } else if (maybeUnderscoreSpecifier) {
        if (specifier) {
          throwError("Already have type specifier");
        }
        throwError("Not implemented yet");
      } else if (token.type === "signed" || token.type === "unsigned") {
        if (signedUnsigned) {
          throwError("Already have signed/unsigned");
        }
        scanner.readNext();
        signedUnsigned = token.type;
      } else if (token.type === "struct") {
        throwError("Not implemented yet");
        // @TODO: Add into symbol table or lookup
      } else if (token.type === "union") {
        throwError("Not implemented yet");
        // @TODO: Add into symbol table or lookup
      } else if (token.type === "enum") {
        throwError("Not implemented yet");
        // @TODO: Add into symbol table or lookup
      } else if (maybeSpecifierFromSymbolTable) {
        if (specifier) {
          throwError("Already have specifier");
        }
        specifier = {
          // Important to clone here - we might modify it
          ...maybeSpecifierFromSymbolTable,
        };
        allowArithmeticTypeModification = false;
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

    // @TODO: "volatile" and "restrict" qualifiers

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
    // Here we have default, which allows this function to read empty declarator/abstract-declarator
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
          isCurrentTokenLooksLikeDeclarationSpecifiers()
        ) {
          // Read "parameter-type-list" or "identifier-list" using isAbstractDeclarator
          if (
            isAbstractDeclarator ||
            isCurrentTokenLooksLikeDeclarationSpecifiers() ||
            // Assume no parameters is parameter-type-list
            scanner.current().type === ")"
          ) {
            const [parameters, ellipsis] =
              scanner.current().type === ")"
                ? [[], false]
                : readParameterTypeList();

            const closing = scanner.current();
            if (closing.type !== ")") {
              throwError("Expected )");
            }
            scanner.readNext();

            const savedLeft = left;
            left = (node) => {
              const me: Typename = {
                type: "function",
                const: true,
                haveEndingEllipsis: ellipsis,
                parameters: parameters,
                returnType: node,
              };
              locator.set(me, {
                ...token,
                length: closing.pos - token.pos,
              });
              return savedLeft(me);
            };
          } else {
            throw new Error("TODO Read identifier list");
          }
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
          const nextSymbolIsClosingSquareBrace =
            scanner.nextToken().type === "]";

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
        scanner.readNext();
        const afterIdentifierTokenForLocator = scanner.current();
        // Aha, direct-declarator with identifier
        // Must be null because we checked in above
        nestedAbstractDeclaratorOrDeclaratorOrIdentifier = {
          abstract: false,
          chain: (typeNode) => {
            const declaratorNode: DeclaratorNode = {
              type: "declarator",
              // Unknown yet
              functionSpecifier: null,
              // Unknown yet
              storageSpecifier: null,
              identifier: token.text,
              typename: typeNode,
            };
            locator.set(declaratorNode, {
              ...token,
              length: afterIdentifierTokenForLocator.pos - token.pos,
            });
            // It is not yet a complete declaration yet
            return declaratorNode;
          },
        };
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

  function readParameterDeclaration() {
    const {
      specifier: baseSpecifier,
      storageClassSpecifier,
      functionSpecifier,
    } = readDeclarationSpecifiers();

    const declarator = readAbstractDeclaratorOrDeclaratorCoreless();

    if (storageClassSpecifier && storageClassSpecifier !== "register") {
      throwError(
        "Only register is allowed in parameter storage-class-specifier"
      );
    }
    if (functionSpecifier) {
      throwError("Function specifier is not allowed in parameter declaration");
    }

    if (declarator.abstract) {
      // unnamed prototyped parameters
      const typename = declarator.chain(baseSpecifier);
      return typename;
    } else {
      const namedParameterDeclaration = declarator.chain(baseSpecifier);
      return namedParameterDeclaration;
    }
  }

  function readParameterTypeList() {
    const parameters: (DeclaratorNode | Typename)[] = [];
    let ellipsis = false;
    while (true) {
      if (scanner.current().type === "...") {
        ellipsis = true;
        scanner.readNext();
        break;
      }

      const parameter = readParameterDeclaration();
      parameters.push(parameter);

      if (scanner.current().type === ",") {
        scanner.readNext();
      } else {
        break;
      }
    }
    return [parameters, ellipsis] as const;
  }

  function readDeclaration() {
    // @TODO: use readExternalDeclaration and then throw if it is a function definition
  }

  function readExternalDeclaration() {
    // @TODO
  }

  return {
    readTypeName,
    isCurrentTokenLooksLikeTypeName,
    isCurrentTokenLooksLikeDeclarationSpecifiers,
  };
}
