import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Postfix ++ and --`, async () => {
    const d = await compile<{
      postfix_plusplus(x: number): number;
      postfix_minusminus(x: number): number;
      postfix_plusplus_array(): number;
    }>("emitter5.c");
    const m = d.compiled;

    expect(m.postfix_plusplus(10)).toBe(21);
    expect(m.postfix_minusminus(10)).toBe(19);

    expect(m.postfix_plusplus_array()).toBe(20);
  });
});
