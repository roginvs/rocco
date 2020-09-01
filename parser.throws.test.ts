import { createScannerFunc } from "./scanner.func";
import { Scanner } from "./scanner";
import { readTranslationUnit } from "./parser";
import { testSnapshot } from "./testsnapshot";

function checkTranslationUnitFile(testname: string, code: string) {
  it(`Reads '${testname}'`, () => {
    const scanner = new Scanner(createScannerFunc(code));

    try {
      readTranslationUnit(scanner);
      throw new Error("DID NOT THROW");
    } catch (e) {
      if (e.message === "DID NOT THROW") {
        throw new Error("Expecting to throw");
      }

      const err = {
        name: e.name,
        message: e.message,
        pos: e.pos,
        line: e.line,
        length: e.length,
      };
      if (
        err.pos === undefined ||
        err.line === undefined ||
        e.length === undefined
      ) {
        throw new Error("No location for error");
      }
      testSnapshot("translationunit-throw", testname, err);
    }
  });
}

checkTranslationUnitFile(
  `Duplicate identifiers`,
  `

void test(){
  int r;
  int r;
}

`
);
