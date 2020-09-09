import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`== and recursive`, async () => {
    const d = await compile<{
      compare_eq(x: number, y: number): number;
      factor(x: number): number;
      op_u(type: number, x: number, y: number): number;
    }>("emitter6.c");
    const m = d.compiled;

    expect(m.compare_eq(2, 3)).toBe(0);
    expect(m.compare_eq(2, 2)).toBe(1);

    expect(m.factor(3)).toBe(6);
    expect(m.factor(5)).toBe(2 * 3 * 4 * 5);

    expect(m.op_u(7, 0, 0)).toBe(-1);

    expect(m.op_u(0, 1, 2)).toBe(0);
    expect(m.op_u(0, 2, 2)).toBe(0);
    expect(m.op_u(0, 10, 2)).toBe(1);

    expect(m.op_u(1, 1, 2)).toBe(0);
    expect(m.op_u(1, 2, 2)).toBe(1);
    expect(m.op_u(1, 10, 2)).toBe(1);

    expect(m.op_u(2, 1, 2)).toBe(1);
    expect(m.op_u(2, 2, 2)).toBe(1);
    expect(m.op_u(2, 10, 2)).toBe(0);

    expect(m.op_u(3, 1, 2)).toBe(1);
    expect(m.op_u(3, 2, 2)).toBe(0);
    expect(m.op_u(3, 10, 2)).toBe(0);
  });
});
