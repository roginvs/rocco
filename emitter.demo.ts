import fs from "fs";
import { createScannerFunc } from "./scanner.func";
import { Scanner } from "./scanner";
import { readTranslationUnit } from "./parser";
import { emit } from "./emitter";
import pad from "pad";

const fdata = fs.readFileSync(__dirname + "/test/emitter1.c").toString();

const scanner = new Scanner(createScannerFunc(fdata));

const unit = readTranslationUnit(scanner);

try {
  const r = emit(unit);

  console.info(
    r.moduleCode
      .map((line, id) => `${pad(4, `${id + 1}`, "0")}  ${line}`)
      .join("\n")
  );
  console.info("");

  console.info(
    r.warnings
      .map((w) => `Warn: ${w.msg} at ${w.line}:${w.pos} len=${w.length}`)
      .join("\n")
  );

  console.info("=== wabt ===");

  (async () => {
    const wabt = await import("wabt").then((wabt) => wabt.default());

    const inputWat = "kekekekekekekekeke";
    const inputData = r.moduleCode.join("\n");
    const wasmModule = wabt.parseWat(inputWat, inputData);

    const wasmdata = wasmModule.toBinary({
      log: true,
    });

    console.info(wasmdata.log);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} catch (e) {
  const err = {
    name: e.name,
    message: e.message,
    line: e.location ? e.location.line : 0,
    pos: e.location ? e.location.pos : 0,
    length: e.location ? e.location.length : 0,
  };
  console.info(
    `${err.name} ${err.message} at ${err.line}:${err.pos} len=${err.length}`
  );
}
