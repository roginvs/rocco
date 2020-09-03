import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Func2 returns 41`, async () => {
    const d = await compile<{
      func2(): number;
      func1(): void;
    }>("emitter1.c");

    expect(d.compiled._debug_get_esp()).toBe(132);
    expect(d.compiled.func2()).toBe(41);
    expect(d.compiled._debug_get_esp()).toBe(132);
  });
});
