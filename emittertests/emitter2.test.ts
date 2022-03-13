import { STACK_SIZE } from "../core/emitter.memory";
import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Arrays, sizes and positions`, async () => {
    const d = await compile<{
      get_arr_chars_size(): number;
      get_arr_ints_size(): number;
      get_arr_chars_address(): number;
      get_arr_ints_address(): number;
      int_identity(x: number): number;
      int_sum(x: number, y: number): number;
      change_chars_array(idx: number, value: number): void;
      change_ints_array(idx: number, value: number): void;

      get_arr_ints_address_of_index(index: number): number;
      get_arr_ints_value_of_index(index: number): number;
    }>("emitter2.c");

    expect(d.compiled.get_arr_chars_size()).toBe(9);
    expect(d.compiled.get_arr_ints_size()).toBe(11 * 4);

    expect(d.compiled.get_arr_chars_address()).toBeGreaterThan(STACK_SIZE);
    expect(d.compiled.get_arr_ints_address()).toBeGreaterThan(STACK_SIZE);

    // expect(d.compiled._debug_get_esp()).toBe(20 + 11 * 4);

    for (const x of [0, 99, 113, 600]) {
      expect(d.compiled.int_identity(x)).toBe(x);
    }

    expect(d.compiled.int_sum(2, 15)).toBe(17);

    const chars_mem32_addr = d.compiled.get_arr_chars_address() / 4;
    d.mem32[chars_mem32_addr] = 0;
    d.compiled.change_chars_array(0, 10);
    expect(d.mem32[chars_mem32_addr]).toBe(10);
    d.compiled.change_chars_array(1, 44);
    expect(d.mem32[chars_mem32_addr]).toBe(44 * 256 + 10);
    d.compiled.change_chars_array(2, 33);
    expect(d.mem32[chars_mem32_addr]).toBe(33 * 256 * 256 + 44 * 256 + 10);
    d.compiled.change_chars_array(3, 255);
    expect(d.mem32[chars_mem32_addr]).toBe(
      255 * 256 * 256 * 256 + 33 * 256 * 256 + 44 * 256 + 10
    );

    const ints_mem32_addr = d.compiled.get_arr_ints_address() / 4;
    d.mem32[ints_mem32_addr] = 0;
    d.mem32[ints_mem32_addr] = 0;
    d.compiled.change_ints_array(0, 44);
    d.compiled.change_ints_array(1, 0x1fffffff);
    expect(d.mem32[ints_mem32_addr]).toBe(44);
    expect(d.mem32[ints_mem32_addr + 1]).toBe(0x1fffffff);

    expect(d.compiled.get_arr_ints_address()).toBe(
      d.compiled.get_arr_ints_address_of_index(0)
    );
    expect(d.compiled.get_arr_ints_address() + 4 * 2).toBe(
      d.compiled.get_arr_ints_address_of_index(2)
    );

    d.mem32[ints_mem32_addr + 1] = 0x0fffffff;
    d.mem32[ints_mem32_addr + 2] = 0x0eadbeef;
    expect(d.compiled.get_arr_ints_value_of_index(0)).toBe(44);
    expect(d.compiled.get_arr_ints_value_of_index(1)).toBe(0x0fffffff);
    expect(d.compiled.get_arr_ints_value_of_index(2)).toBe(0x0eadbeef);
  });
});
