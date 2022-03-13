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

interface DebugHelpersExports {
  _debug_get_esp: () => number;
}

export async function compile<E extends WebAssembly.Exports>(
  ...fnames: string[]
) {
  const fdata = fnames
    .map((fname) => fs.readFileSync(__dirname + "/../test/" + fname).toString())
    .join("\n");

  try {
    const scanner = new Scanner(createScannerFunc(fdata));

    const unit = readTranslationUnit(scanner);

    const emitted = emit(unit);

    const wabt = await import("wabt").then((wabt1) => wabt1.default());

    // This file name is only for debug purposes
    const inputWat = "main";
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

    //console.info(wasmdata.log);

    const SHOW = false;
    if (SHOW) {
      console.info(
        emitted.moduleCode
          .map((line, id) => `${pad(4, `${id + 1}`, "0")}  ${line}`)
          .join("\n")
      );
    }

    const module = await WebAssembly.compile(wasmdata.buffer);

    // const esp = new WebAssembly.Global({ value: "i32", mutable: true }, 0);
    const memory = new WebAssembly.Memory({
      initial: 100,
      maximum: 1000,
    });

    const instance = await WebAssembly.instantiate(module, {
      js: { memory: memory },
    });

    const compiled = instance.exports as E & DebugHelpersExports;

    const mem32 = new Uint32Array(memory.buffer);

    const mem8 = new Uint8Array(memory.buffer);

    return {
      warnings: emitted.warnings,
      compiled,
      memory,
      mem32,
      mem8,
    };
  } catch (e) {
    writeErrorInfo(e);
    throw e;
  }
}
