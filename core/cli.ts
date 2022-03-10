import fs from "fs";
import { Scanner } from "./scanner";
import { createScannerFunc } from "./scanner.func";
import { readTranslationUnit } from "./parser";
import { emit } from "./emitter";

const args = process.argv.slice(2);

const inFileName = args[0];
const outFileName = args[1];
if (!inFileName || !outFileName) {
  console.info("Usage: ./rocco <in file> <out file>");
  process.exit(1);
}

const inFileData = fs.readFileSync(inFileName).toString();

try {
  const scanner = new Scanner(createScannerFunc(inFileData));

  const unit = readTranslationUnit(scanner);

  const emitted = emit(unit);

  if (emitted.warnings.length > 0) {
    console.info("Warnings:");
    emitted.warnings.forEach((w) =>
      console.info(`  ${w.msg} at ${w.line}:${w.pos}`)
    );
  }

  console.info(" ");

  const outData = emitted.moduleCode.join("\n") + "\n";

  if (fs.existsSync(outFileName)) {
    console.error(`Outfile '${outFileName} exists`);
    process.exit(1);
  }

  fs.writeFileSync(outFileName, outData);
} catch (e: any) {
  const err = {
    name: e.name,
    message: e.message,
    line: e.location?.line,
    pos: e.location?.pos,
    length: e.location?.length,
  };
  console.info(
    `${err.name} ${err.message} at ${err.line}:${err.pos} len=${err.length}`
  );
  console.info("");
  console.info(e.stack);
  process.exit(1);
}
