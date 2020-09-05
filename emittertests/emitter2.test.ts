import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Arrays, sizes and positions`, async () => {
    const d = await compile<{
      get_arr_chars_size(): number;
      get_arr_ints_size(): number;
      get_arr_chars_address(): number;
      get_arr_ints_address(): number;
      get_hacky_esp(): number;
      int_identity(x: number): number;
      int_sum(x: number, y: number): number;
    }>("emitter2.c");

    expect(d.compiled.get_arr_chars_size()).toBe(9);
    expect(d.compiled.get_arr_ints_size()).toBe(11 * 4);

    expect(d.compiled.get_arr_chars_address()).toBe(8);
    expect(d.compiled.get_arr_ints_address()).toBe(8 + 9 + /* padding */ 3);

    expect(d.compiled._debug_get_esp()).toBe(20 + 11 * 4);

    expect(d.compiled.get_hacky_esp()).toBe(d.compiled._debug_get_esp());

    for (const x of [0, 99, 113, 600]) {
      expect(d.compiled.int_identity(x)).toBe(x);
    }
    //asd
  });
});
