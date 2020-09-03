import fs from "fs";
import { createScannerFunc } from "../core/scanner.func";
import { Scanner } from "../core/scanner";
import { readTranslationUnit } from "../core/parser";
import { emit } from "../core/emitter";
import pad from "pad";

function writeErrorInfo(e: any) {
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

export async function compile<E extends WebAssembly.Exports>(fname: string) {
  const fdata = fs.readFileSync(__dirname + "/../test/" + fname).toString();

  try {
    const scanner = new Scanner(createScannerFunc(fdata));

    const unit = readTranslationUnit(scanner);

    const emitted = emit(unit);

    const wabt = await import("wabt").then((wabt1) => wabt1.default());

    // This file name is only for debug purposes
    const inputWat = fname;
    const inputData = emitted.moduleCode.join("\n");

    const wasmModule = (() => {
      try {
        const wasmModule1 = wabt.parseWat(inputWat, inputData);
        return wasmModule1;
      } catch (e) {
        console.info(
          emitted.moduleCode
            .map((line, id) => `${pad(4, `${id + 1}`, "0")}  ${line}`)
            .join("\n")
        );

        console.info(e);
        throw e;
      }
    })();

    const wasmdata = wasmModule.toBinary({
      log: true,
    });

    // console.info("======== running ==== ");

    const module = await WebAssembly.compile(wasmdata.buffer);

    // const esp = new WebAssembly.Global({ value: "i32", mutable: true }, 0);
    const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });

    const instance = await WebAssembly.instantiate(module, {
      js: { memory: memory },
    });

    const compiled = instance.exports as E;

    const mem32 = new Uint32Array(memory.buffer);

    return {
      warnings: emitted.warnings,
      compiled,
      memory,
      mem32: mem32,
    };
  } catch (e) {
    writeErrorInfo(e);
    throw e;
  }
}
