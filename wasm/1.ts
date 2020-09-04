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

  const mymodule = instance.exports as {
    savingadd: (n: number) => number;
    test_nested_br: () => number;
    test_stack_values: () => number;
    blocks_and_ifs: (n: number) => number;
  };

  /*
  console.info(exports.savingadd(1));
  console.info(exports.savingadd(1));
  console.info(exports.savingadd(1));
  console.info(exports.savingadd(1));

  console.info("loop1()=", (instance.exports as any).loop1());
  console.info("loop2()=", (instance.exports as any).loop2());
  */

  console.info(`test_nested_br = ${mymodule.test_nested_br()}`);
  console.info(`test_stack_values = ${mymodule.test_stack_values()}`);
  console.info("");
  for (const v of [9, 11]) {
    console.info(`blocks_and_ifs(${v}) = ${mymodule.blocks_and_ifs(v)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
