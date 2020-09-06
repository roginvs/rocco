import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Arrays, sizes and positions`, async () => {
    const d = await compile<{
      compound_expression(x: number): number;
    }>("emitter3.c");

    expect(d.compiled.compound_expression(8)).toBe(20);
    expect(d.compiled.compound_expression(11)).toBe(22 + 4);
  });
});
