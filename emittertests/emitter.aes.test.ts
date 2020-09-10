import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`aes funcs`, async () => {
    const d = await compile<{
      init_tables(): number;
    }>("emitter.galois.c", "emitter.aes.c");
  });
});
