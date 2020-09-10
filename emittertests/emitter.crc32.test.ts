import { compile } from "./funcs";
import { assert } from "console";

describe(`Emits and compiles`, () => {
  it(`crc32`, async () => {
    const d = await compile<{
      crc32_init_table(): void;
      crc32(data_addr: number, data_len: number): number;
    }>("emitter.crc32.c");

    d.compiled.crc32_init_table();

    const data_pos = 1000;

    // crc32 <(echo -n 'Vasilii')

    const data1 = fromString("Vasilii");
    memcpyTo(d.mem8, data1, data_pos);
    expect(d.compiled.crc32(data_pos, data1.length)).toBe(0x2701c6cc);

    const data2 = fromString("");
    expect(d.compiled.crc32(data_pos, data2.length)).toBe(0x00000000);

    const data3 = fromString("lol");
    memcpyTo(d.mem8, data3, data_pos);
    expect(d.compiled.crc32(data_pos, data3.length)).toBe(0x18edb14d);

    const data4 = fromString("Rocco is a Rogin C Compiler");
    memcpyTo(d.mem8, data4, data_pos);
    expect(d.compiled.crc32(data_pos, data4.length)).toBe(0xbc4229f6 >> 0);
  });
});

function fromString(str: string) {
  return [...str.split("").map((c) => c.charCodeAt(0))];
}

function memcpyTo(mem8: Uint8Array, data: number[], addr: number) {
  for (let i = 0; i < data.length; i++) {
    mem8[addr + i] = data[i];
  }
}
