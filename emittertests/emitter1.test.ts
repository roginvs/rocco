import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Check esp`, async () => {
    const d = await compile<{
      func2(): number;
      func1(): void;
    }>("emitter1.c");

    expect(d.compiled.func2()).toBe(41);
  });
});
