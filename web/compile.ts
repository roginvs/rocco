import { Scanner } from "../core/scanner";
import { createScannerFunc } from "../core/scanner.func";
import { readTranslationUnit } from "../core/parser";
import { emit } from "../core/emitter";
import pad from "pad";
import { writeAst } from "./ast";

export function getComliledOutput(input: string) {
  let out = "";
  const write = (inStr: string): void => {
    out += inStr + "\n";
  };

  write("=== Source file ===");
  input
    .split("\n")
    .forEach((line, idx) => write(`${pad(`${idx + 1}`, 5, " ")}   ${line}`));

  try {
    const scanner = new Scanner(createScannerFunc(input));

    const unit = readTranslationUnit(scanner);

    const emitted = emit(unit);

    if (emitted.warnings.length > 0) {
      write("Warnings:");
      emitted.warnings.forEach((w) =>
        write(`  ${w.msg} at ${w.line}:${w.pos}`)
      );
    }

    //TODO: Write ast
    write(" ");
    write("=== ast ===");
    writeAst(unit, write);

    write(" ");
    write("=== WebAssembly text ===");
    emitted.moduleCode.forEach((line) => write(line));
  } catch (e) {
    const err = {
      name: e.name,
      message: e.message,
      line: e.location?.line,
      pos: e.location?.pos,
      length: e.location?.length,
    };
    write(
      `${err.name} ${err.message} at ${err.line}:${err.pos} len=${err.length}`
    );
    write("");
    write(e.stack);
  }

  return out;
}
