import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Calling functions`, async () => {
    const d = await compile<{
      call_simple_1(x: number): number;
      call_simple_2(x: number, y: number): number;
      call_simple_3(x: number): number;
    }>("emitter4.c");

    expect(d.compiled.call_simple_1(8)).toBe(17);

    expect(d.compiled.call_simple_2(7, 11)).toBe(7 * 2 + 11);

    expect(d.compiled.call_simple_3(130)).toBe(130 + 11);
  });
});
