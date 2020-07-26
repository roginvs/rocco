import { Typename, createTypeParser } from "./parser.typename";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";

describe("PisCurrentTokenLooksLikeTypeName", () => {
  const YES = ["int", "void", "struct", "const", "signed", "unsigned"];
  const NO = ["2" /* todo: add symbol table */, "kek", "2+4", "/", "++4"];

  for (const t of [
    ...YES.map((s) => ({ s, yes: true })),
    ...NO.map((s) => ({ s, yes: false })),
  ]) {
    it(`Expects ${t.s} = ${t.yes}`, () => {
      const scanner = new Scanner(createScannerFunc(t.s));
      const parser = createTypeParser(scanner);
      expect(parser.isCurrentTokenLooksLikeTypeName()).toStrictEqual(t.yes);
    });
  }
});

describe("Parsing typename", () => {
  function checkTypename(str: string, ast?: Typename) {
    it(`Reads '${str}'`, () => {
      const scanner = new Scanner(createScannerFunc(str));
      const parser = createTypeParser(scanner);
      const node = parser.readTypeName();
      if (ast) {
        expect(node).toMatchObject(ast);
      } else {
        console.info(JSON.stringify(node));
      }

      expect(scanner.current().type).toBe("end");
    });
  }

  function checkFailingType(str: string) {
    it(`Throws on '${str}'`, () => {
      const scanner = new Scanner(createScannerFunc(str));
      const parser = createTypeParser(scanner);
      expect(() => parser.readTypeName()).toThrow();
    });
  }

  checkFailingType("const");
  checkFailingType("const const int");
  checkFailingType("const unsigned unsigned int");
  checkFailingType("const unsigned signed int");
  checkFailingType("const void");
  checkFailingType("void const");
  checkFailingType("void unsigned");
  checkFailingType("signed void");

  checkTypename("const int", {
    type: "arithmetic",
    arithmeticType: "int",
    const: true,
  });

  checkTypename("int", {
    type: "arithmetic",
    arithmeticType: "int",
    // const: undefined,
  });
  checkTypename("const unsigned char", {
    type: "arithmetic",
    arithmeticType: "char",
    signedUnsigned: "unsigned",
    const: true,
  });
});
