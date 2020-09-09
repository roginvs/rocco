import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`aes`, async () => {
    const d = await compile<{
      _inverse_bits_address(): number;
      _init_inverse_bits_table(): void;
    }>("emitter.aes.c");

    d.compiled._init_inverse_bits_table();

    const inverse_addr = d.compiled._inverse_bits_address();

    expect(d.mem8[inverse_addr + 0x00]).toBe(0x00);
    expect(d.mem8[inverse_addr + 0b00000001]).toBe(0b10000000);
    expect(d.mem8[inverse_addr + 0xff]).toBe(0xff);
    expect(d.mem8[inverse_addr + 0b11111110]).toBe(0b01111111);
  });
});
