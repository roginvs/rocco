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
      change_chars_array(idx: number, value: number): void;
      change_ints_array(idx: number, value: number): void;
    }>("emitter3.c");

    //asd
  });
});
