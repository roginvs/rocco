import { createScannerFunc } from "./scanner.func";
import { Scanner } from "./scanner";
import { readTranslationUnit } from "./parser";
import { testSnapshot } from "./testsnapshot";
import * as fs from "fs";

function checkTranslationUnit(fname: string) {
  it(`Reads '${fname}'`, () => {
    const fdata = fs
      .readFileSync(__dirname + "/test/" + fname + ".c")
      .toString();

    const scanner = new Scanner(createScannerFunc(fdata));

    const node = readTranslationUnit(scanner);

    testSnapshot("checkTranslationUnit", fname, node);

    expect(scanner.current().type).toBe("end");
  });
}

checkTranslationUnit("simpleunit");
