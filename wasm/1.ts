import { loadWat } from "./loadWat";

async function main() {
  const mymodule = await loadWat<{
    savingadd: (n: number) => number;
    test_nested_br: () => number;
    test_stack_values: () => number;
    blocks_and_ifs: (n: number) => number;
    test_nested_br_3(): number;
  }>("1.wat");

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

  console.info("===");
  console.info(mymodule.test_nested_br_3());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
