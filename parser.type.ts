import { Scanner } from "./scanner";
import {
  ARITHMETIC_TYPE,
  Punctuator,
  BinaryOperator,
  Token,
  TypeQualifier,
  TYPE_QUALIFIERS,
  TypeSignedUnsigned,
  ArithmeticType,
} from "./scanner.func";


export type TypeSpecifier = {type: "void"} | {
  type: "arithmetic",
  keyword: ArithmeticType,
  signed?: TypeSignedUnsigned
} | {
  type: "struct",
  // @TODO
} | {
  type: "enum",
  // @TODO
};

export function createTypeParser(scanner: Scanner) {

  function isCurrentTokenTypeQualifier(){
    const token = scanner.current();
    const qualifier = TYPE_QUALIFIERS.find(x => token.type === "keyword" && token.keyword === x);
    return qualifier;
  }

  function isCurrentTokenTypeSpecifier() {
    const token = scanner.current();

  }

  function readSpecifierQualifierList() {
    const qualifiers[]: TypeQualifier[] = [];
    while (true){

      const qualifier = isCurrentTokenTypeQualifier();
      
      if (qualifier) {
        scanner.readNext();
        qualifiers.push(qualifier)
      } else {
        break
      }
    }
  }

  function readTypeName() {}
}
