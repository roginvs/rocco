import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`galois`, async () => {
    const d = await compile<{
      _inverse_bits_address(): number;
      _init_inverse_bits_table(): void;
      poly_multiple_inversed(a: number, b: number): number;
      poly_multiple(a: number, b: number): number;
      _get_bezout_identity(
        a: number,
        b: number,
        a_have_highest_bit: number,
        x_addr: number,
        y_addr: number
      ): number;
      get_inverse_element(a: number): number;
    }>("emitter.galois.c");

    d.compiled._init_inverse_bits_table();

    const inverse_addr = d.compiled._inverse_bits_address();

    // Check https://github.com/roginvs/test_crypto/blob/master/galois.test.c

    expect(d.mem8[inverse_addr + 0x00]).toBe(0x00);
    expect(d.mem8[inverse_addr + 0b00000001]).toBe(0b10000000);
    expect(d.mem8[inverse_addr + 0xff]).toBe(0xff);
    expect(d.mem8[inverse_addr + 0b11111110]).toBe(0b01111111);

    const inverse_bits = (n: number) => d.mem8[inverse_addr + n];

    expect(
      d.compiled.poly_multiple_inversed(
        inverse_bits(0b001100),
        inverse_bits(0b1100001)
      )
    ).toBe(inverse_bits(0b10111010));

    for (let i = 0xff; i > 0; i--) {
      const target = i;
      const result = d.compiled.get_inverse_element(target);

      const multiplication = d.compiled.poly_multiple(target, result);

      expect(multiplication).toBe(1);
    }
  });
});
