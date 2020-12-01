import { readFileSync } from "fs";
import { Scanner } from "../core/scanner";
import { createScannerFunc } from "../core/scanner.func";
import { readTranslationUnit } from "../core/parser";
import { emit } from "../core/emitter";
import { writeEspCode } from "../core/emitter.utils";
import pad from "pad";
import { writeAst } from "./ast";

const aesCode = readFileSync(__dirname + "/../test/emitter.aes.c").toString();
const crc32Code = readFileSync(
  __dirname + "/../test/emitter.crc32.c"
).toString();
const simpleExampleCode = readFileSync(
  __dirname + "/simple_example.c"
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

(document.getElementById("back") as HTMLButtonElement).onclick = () => {
  logDiv.innerHTML = "";

  main1.style.display = "";

  main2.style.display = "none";
};

(document.getElementById("load_simple") as HTMLButtonElement).onclick = () => {
  textArea.value = simpleExampleCode;
};
(document.getElementById("load_aes") as HTMLButtonElement).onclick = () => {
  textArea.value = aesCode;
};
(document.getElementById("load_crc32") as HTMLButtonElement).onclick = () => {
  textArea.value = crc32Code;
};

function go() {
  const input = textArea.value;

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
}

textArea.value = simpleExampleCode;

// Demoing
// setTimeout(() => go(), 1);

document.getElementById("built_time")!.innerText =
  "Built at " +
  new Date(parseInt(process.env.BUILD_TIME || "") * 1000).toLocaleString();

document.getElementById("main0")!.style.display = "none";
main1.style.display = "";

const testCoverageLink = document.getElementById(
  "test_coverage"
) as HTMLAnchorElement;
testCoverageLink.href = "coverage/lcov-report/core/index.html";
testCoverageLink.innerText = "Test coverage";
