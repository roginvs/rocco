import { readFileSync } from "fs";
import { Scanner } from "../core/scanner";
import { createScannerFunc } from "../core/scanner.func";
import { readTranslationUnit } from "../core/parser";
import { emit } from "../core/emitter";
import { writeEspCode } from "../core/emitter.utils";
import pad from "pad";

const aesCode = readFileSync(__dirname + "/../test/emitter.aes.c").toString();
const crc32Code = readFileSync(
  __dirname + "/../test/emitter.crc32.c"
).toString();

const textArea = document.getElementById("src") as HTMLTextAreaElement;

(document.getElementById("compile") as HTMLButtonElement).onclick = go;

const main1 = document.getElementById("main1") as HTMLDivElement;
const main2 = document.getElementById("main2") as HTMLDivElement;
const logDiv = document.getElementById("log") as HTMLDivElement;

function write(msg: string) {
  const el = document.createElement("div");
  el.innerHTML = msg;
  logDiv.appendChild(el);
}

function go() {
  const input = textArea.value;

  logDiv.innerHTML = "";
  main1.style.display = "none";

  main2.style.display = "";

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
    write("=== WebAssembly text ===");
    emitted.moduleCode.forEach((line) => write(line));
  } catch (e) {
    const err = {
      name: e.name,
      message: e.message,
      line: e.location.line,
      pos: e.location.pos,
      length: e.location.length,
    };
    write("ERROR:");
    write(
      `${err.name} ${err.message} at ${err.line}:${err.pos} len=${err.length}`
    );
  }
}

textArea.value = `
int func1(int i){
  return i + 1;
}

`;

// Demoing
setTimeout(() => go(), 1);
