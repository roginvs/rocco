import { createScannerFunc } from "./scanner.func";
import { Scanner } from "./scanner";
import { readTranslationUnit } from "./parser";
import { testSnapshot } from "./testsnapshot";

function checkTranslationUnitThrows(testname: string, code: string) {
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
        line: e.location.line,
        pos: e.location.pos,
        length: e.location.length,
      };
      if (
        err.pos === undefined ||
        err.line === undefined ||
        err.length === undefined
      ) {
        throw new Error("No location for error");
      }
      testSnapshot("translationunit-throw", testname, err, code);
    }
  });
}

checkTranslationUnitThrows(
  `Duplicate identifiers`,
  `
void test(){
  int r;
  int r;
}
`
);

checkTranslationUnitThrows(
  "expect function",
  `
int f[] {

}
`
);
checkTranslationUnitThrows(
  "no array from function",
  `
int f()[] {

}
`
);

checkTranslationUnitThrows(
  `Parameter name omitted`,
  `
void kek2(int){
  
}

`
);

checkTranslationUnitThrows(
  "return in file scope",
  `

return;

`
);
