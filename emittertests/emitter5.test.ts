import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Postfix ++ and --`, async () => {
    const d = await compile<{
      postfix_plusplus(x: number): number;
      prefix_plusplus(x: number): number;
      postfix_minusminus(x: number): number;
      postfix_plusplus_array(): number;
      sizeof_typename(): number;

      bitwise_reverse(x: number): number;
      not(x: number): number;
      minus(x: number): number;
      plus(x: number): number;

      shl(i: number, j: number): number;
      shr_s(i: number, j: number): number;
      shr_u(i: number, j: number): number;

      test_typedef(): number;
    }>("emitter5.c");
    const m = d.compiled;

    expect(m.postfix_plusplus(10)).toBe(21);
    expect(m.postfix_minusminus(10)).toBe(19);

    expect(m.postfix_plusplus_array()).toBe(20);

    expect(m.prefix_plusplus(10)).toBe(22);

    expect(m.sizeof_typename()).toBe(20);

    expect(m.bitwise_reverse(0xffffffff)).toBe(0);
    expect(m.bitwise_reverse(0xff00ff00)).toBe(0x00ff00ff);

    expect(m.not(0)).toBe(1);
    expect(m.not(1)).toBe(0);
    expect(m.not(100)).toBe(0);

    expect(m.minus(0)).toBe(0);
    expect(m.minus(1)).toBe(-1);
    expect(m.minus(11)).toBe(-11);
    expect(m.minus(-15)).toBe(15);

    expect(m.plus(0)).toBe(0);
    expect(m.plus(1)).toBe(1);

    expect(m.shl(22, 3)).toBe(176);
    expect(m.shr_u(176, 3)).toBe(22);
    expect(m.shr_s(176, 3)).toBe(22);

    expect(m.shr_s(0xf0ff00f0, 8)).toBe(0xf0ff00f0 >> 8);
    expect(m.shr_u(0xf0ff00f0, 8)).toBe(15793920);

    expect(m.test_typedef()).toBe(333);
  });
});
