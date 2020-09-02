import fs from "fs";
import { createScannerFunc } from "./scanner.func";
import { Scanner } from "./scanner";
import { readTranslationUnit } from "./parser";
import { emit } from "./emitter";

const fdata = fs.readFileSync(__dirname + "/test/emitter1.c").toString();

const scanner = new Scanner(createScannerFunc(fdata));

const unit = readTranslationUnit(scanner);

try {
  const code = emit(unit);

  console.info(code);
} catch (e) {
  const err = {
    name: e.name,
    message: e.message,
    line: e.location.line,
    pos: e.location.pos,
    length: e.location.length,
  };
  console.info(
    `${err.name} ${err.message} at ${err.line}:${err.pos} len=${err.length}`
  );
}
