import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`aes`, async () => {
    const d = await compile<{
      _inverse_bits_address(): number;
      _init_inverse_bits_table(): void;
      poly_multiple_inversed(a: number, b: number): number;
      poly_multiple(a: number, b: number): number;
    }>("emitter.aes.c");

    d.compiled._init_inverse_bits_table();

    const inverse_addr = d.compiled._inverse_bits_address();

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

    expect(d.compiled.poly_multiple(0x57, 0x13)).toBe(0xfe);
  });
});
