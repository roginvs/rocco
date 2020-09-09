import * as fs from "fs";

export async function loadWat<T extends WebAssembly.Exports>(fname: string) {
  const wabt = await import("wabt").then((wabt1) => wabt1.default());

  const inputWat = __dirname + "/" + fname;

  const inputData = fs.readFileSync(inputWat, "utf8");

  const wasmModule = wabt.parseWat(inputWat, inputData);

  const wasmdata = wasmModule.toBinary({
    log: true,
  });

  console.info(wasmdata.log);

  const module = await WebAssembly.compile(wasmdata.buffer);
  const instance = await WebAssembly.instantiate(module);

  console.info(instance.exports);

  const mymodule = instance.exports as T;
  return mymodule;
}
