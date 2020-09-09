import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`== and recursive`, async () => {
    const d = await compile<{
      compare_eq(x: number, y: number): number;
      factor(x: number): number;
    }>("emitter6.c");
    const m = d.compiled;

    expect(m.compare_eq(2, 3)).toBe(0);
    expect(m.compare_eq(2, 2)).toBe(1);
  });
});
