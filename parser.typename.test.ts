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
  function checkExpression(str: string, ast?: Typename) {
    if (ast) {
      it(`Reads '${str}'`, () => {
        const scanner = new Scanner(createScannerFunc(str));
        const parser = createTypeParser(scanner);
        const node = parser.readTypeName();

        expect(node).toMatchObject(ast);

        expect(scanner.current().type).toBe("end");
      });
    } else {
      it.skip(`Reads '${str}'`, () => {
        const scanner = new Scanner(createScannerFunc(str));
        const parser = createTypeParser(scanner);
        const node = parser.readTypeName();

        console.info(JSON.stringify(node));

        expect(scanner.current().type).toBe("end");
      });
    }
  }

  // @TODO
});
