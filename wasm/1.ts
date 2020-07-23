import * as fs from "fs";

async function main() {
  const wabt = await import("wabt").then((wabt) => wabt.default());

  const inputWat = __dirname + "/1.wat";

  const inputData = fs.readFileSync(inputWat, "utf8");

  const wasmModule = wabt.parseWat(inputWat, inputData);

  const wasmdata = wasmModule.toBinary({
    log: true,
  });

  console.info(wasmdata.log);

  const module = await WebAssembly.compile(wasmdata.buffer);
  const instance = await WebAssembly.instantiate(module);

  console.info(instance.exports);

  const savingadd = instance.exports.savingadd as (n: number) => number;
  console.info(savingadd(1));
  console.info(savingadd(1));
  console.info(savingadd(1));
  console.info(savingadd(1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
