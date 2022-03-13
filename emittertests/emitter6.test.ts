import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`== and recursive`, async () => {
    const d = await compile<{
      compare_eq(x: number, y: number): number;
      factor(x: number): number;
      op_u(type: number, x: number, y: number): number;
      op_s(type: number, x: number, y: number): number;
      conditional(cond: number, left: number, right: number): number;
    }>("emitter6.c");
    const m = d.compiled;

    expect(m.compare_eq(2, 3)).toBe(0);
    expect(m.compare_eq(2, 2)).toBe(1);

    expect(m.factor(3)).toBe(6);
    expect(m.factor(5)).toBe(2 * 3 * 4 * 5);

    expect(m.op_u(9, 0, 0)).toBe(-1);

    expect(m.op_u(0, 1, 2)).toBe(0);
    expect(m.op_u(0, 2, 2)).toBe(0);
    expect(m.op_u(0, 10, 2)).toBe(1);

    expect(m.op_u(1, 1, 2)).toBe(0);
    expect(m.op_u(1, 2, 2)).toBe(1);
    expect(m.op_u(1, 10, 2)).toBe(1);

    expect(m.op_u(2, 1, 2)).toBe(1);
    expect(m.op_u(2, 2, 2)).toBe(0);
    expect(m.op_u(2, 10, 2)).toBe(0);

    expect(m.op_u(3, 1, 2)).toBe(1);
    expect(m.op_u(3, 2, 2)).toBe(1);
    expect(m.op_u(3, 10, 2)).toBe(0);

    expect(m.op_u(4, 10, 10)).toBe(1);
    expect(m.op_u(4, 10, 3)).toBe(0);
    expect(m.op_u(5, 10, 10)).toBe(0);
    expect(m.op_u(5, 10, 3)).toBe(1);
    expect(m.op_u(6, 0x00ff00ff, 0x00fa2302)).toBe(0x00ff00ff ^ 0x00fa2302);

    expect(m.op_u(0, 0xffffffff, 2)).toBe(1);
    expect(m.op_s(0, 0xffffffff, 2)).toBe(0);

    expect(m.op_u(7, 1, 1)).toBe(1);
    expect(m.op_u(7, 0, 1)).toBe(1);
    expect(m.op_u(7, 1, 0)).toBe(1);
    expect(m.op_u(7, 0, 0)).toBe(0);

    expect(m.op_u(8, 1, 1)).toBe(1);
    expect(m.op_u(8, 0, 1)).toBe(0);
    expect(m.op_u(8, 1, 0)).toBe(0);
    expect(m.op_u(8, 0, 0)).toBe(0);

    expect(m.conditional(1, 11, 33)).toBe(11);
    expect(m.conditional(11, 11, 33)).toBe(11);
    expect(m.conditional(0, 11, 33)).toBe(33);
  });

  it(`Stack is overflowing`, async () => {
    const d = await compile<{
      compare_eq(x: number, y: number): number;
      factor(x: number): number;
      op_u(type: number, x: number, y: number): number;
      op_s(type: number, x: number, y: number): number;
      conditional(cond: number, left: number, right: number): number;
    }>("emitter6.c");
    const m = d.compiled;
    expect(() => m.factor(100000)).toThrow();
  });
});
