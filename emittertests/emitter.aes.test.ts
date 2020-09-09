import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`aes`, async () => {
    const d = await compile<{}>("emitter.aes.c");
  });
});
