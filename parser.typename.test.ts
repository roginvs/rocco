import { createTypeParser, TypeParserDependencies } from "./parser.typename";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { Typename } from "./parser.definitions";

const createMockedExpressionParser = (scanner: Scanner) => {
  const mock: TypeParserDependencies = {
    readAssignmentExpression() {
      const nextToken = scanner.current();
      if (nextToken.type !== "const") {
        throw new Error("Not implemented in mocked expression scanner");
      }
      scanner.readNext();
      const constNode = {
        type: "const" as const,
        subtype: "int" as const,
        value: nextToken.value,
      };

      const closing = scanner.current();
      if (closing.type !== "]") {
        throw new Error("Expected ]");
      }
      scanner.readNext();

      return constNode;
    },
  };
  return mock;
};

describe("PisCurrentTokenLooksLikeTypeName", () => {
  const YES = ["int", "void", "struct", "const", "signed", "unsigned"];
  const NO = ["2" /* todo: add symbol table */, "kek", "2+4", "/", "++4"];

  for (const t of [
    ...YES.map((s) => ({ s, yes: true })),
    ...NO.map((s) => ({ s, yes: false })),
  ]) {
    it(`Expects ${t.s} = ${t.yes}`, () => {
      const scanner = new Scanner(createScannerFunc(t.s));
      const parser = createTypeParser(
        scanner,
        createMockedExpressionParser(scanner)
      );
      expect(parser.isCurrentTokenLooksLikeTypeName()).toStrictEqual(t.yes);
    });
  }
});

function checkTypename(str: string, ast?: Typename) {
  it(`Reads '${str}'`, () => {
    const scanner = new Scanner(createScannerFunc(str));
    const parser = createTypeParser(
      scanner,
      createMockedExpressionParser(scanner)
    );
    const node = parser.readTypeName();
    if (ast) {
      expect(node).toMatchObject(ast);
    } else {
      console.info(JSON.stringify(node));
    }

    expect(scanner.current().type).toBe("end");
  });
}

describe("Parsing typename", () => {
  function checkFailingType(str: string) {
    it(`Throws on '${str}'`, () => {
      const scanner = new Scanner(createScannerFunc(str));
      const parser = createTypeParser(
        scanner,
        createMockedExpressionParser(scanner)
      );
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

  checkTypename("char **const", {
    type: "pointer",
    pointsTo: {
      type: "pointer",
      pointsTo: { type: "arithmetic", arithmeticType: "char" },
    },
    const: true,
  });
  checkTypename("char *const*", {
    type: "pointer",
    pointsTo: {
      type: "pointer",
      pointsTo: { type: "arithmetic", arithmeticType: "char" },
      const: true,
    },
  });

  checkTypename("char *[3][7]", {
    type: "array",
    size: { type: "const", subtype: "int", value: 3 },
    elementsTypename: {
      type: "array",
      size: { type: "const", subtype: "int", value: 7 },
      elementsTypename: {
        type: "pointer",
        pointsTo: { type: "arithmetic", arithmeticType: "char" },
        const: false,
      },
    },
  });

  checkTypename("char (*)[33]", {
    type: "pointer",
    pointsTo: {
      type: "array",
      size: { type: "const", subtype: "int", value: 33 },
      elementsTypename: { type: "arithmetic", arithmeticType: "char" },
    },
    const: false,
  });

  checkTypename("char * const (* const *)[5][10]", {
    type: "pointer",
    const: false,
    pointsTo: {
      type: "pointer",
      const: true,
      pointsTo: {
        type: "array",
        size: { type: "const", subtype: "int", value: 5 },
        elementsTypename: {
          type: "array",
          size: { type: "const", subtype: "int", value: 10 },
          elementsTypename: {
            type: "pointer",
            const: true,
            pointsTo: { type: "arithmetic", arithmeticType: "char" },
          },
        },
      },
    },
  });
});
