import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Compount statement, if branches`, async () => {
    const d = await compile<{
      compound_expression(x: number): number;
      compound_expression_return(x: number): number;
      is_value_eleven_1(x: number): number;
      is_value_eleven_2(x: number): number;
      is_value_eleven_3(x: number): number;
      for_loop_1(): number;
    }>("emitter3.c");

    expect(d.compiled.compound_expression(8)).toBe(20);
    expect(d.compiled.compound_expression(11)).toBe(22 + 4);

    expect(d.compiled.compound_expression_return(11)).toBe(12);

    expect(d.compiled.is_value_eleven_1(11)).toBe(222);
    expect(d.compiled.is_value_eleven_1(12)).toBe(111);
    expect(d.compiled.is_value_eleven_1(10)).toBe(111);

    expect(d.compiled.is_value_eleven_2(11)).toBe(222);
    expect(d.compiled.is_value_eleven_2(12)).toBe(111);
    expect(d.compiled.is_value_eleven_2(10)).toBe(111);

    expect(d.compiled.is_value_eleven_3(11)).toBe(222);
    expect(d.compiled.is_value_eleven_3(12)).toBe(111);
    expect(d.compiled.is_value_eleven_3(10)).toBe(111);

    expect(d.compiled.for_loop_1()).toBe((10 * 9) / 2 + 100);
  });
});
