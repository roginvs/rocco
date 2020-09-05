import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Arrays, sizes and positions`, async () => {
    const d = await compile<{
      get_arr_chars_size(): number;
      get_arr_ints_size(): number;
    }>("emitter2.c");

    expect(d.compiled.get_arr_chars_size()).toBe(9);
    expect(d.compiled.get_arr_ints_size()).toBe(11 * 4);

    //asd
  });
});
