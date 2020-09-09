import { loadWat } from "./loadWat";

async function main() {
  const mymodule = await loadWat<{
    test_char_arithmetic: () => number;
  }>("2.wat");

  /*
  console.info(exports.savingadd(1));
  console.info(exports.savingadd(1));
  console.info(exports.savingadd(1));
  console.info(exports.savingadd(1));

  console.info("loop1()=", (instance.exports as any).loop1());
  console.info("loop2()=", (instance.exports as any).loop2());
  */

  // asdasd
  console.info("Result is ", mymodule.test_char_arithmetic());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
