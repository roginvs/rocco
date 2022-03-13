import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`aes funcs`, async () => {
    const d = await compile<{
      init_tables(): void;
      _address_sbox(): number;
      fill_key_expansion(
        cipher_key_addr: number,
        key_size: number,
        expanded_key_addr: number
      ): void;
      aes_encrypt_block(
        block_addr: number,
        expanded_key_addr: number,
        key_size: number
      ): void;
    }>("emitter.aes.c");

    d.compiled.init_tables();

    const sbox_addr = d.compiled._address_sbox();

    // sbox
    expect(d.mem8[sbox_addr + 0x00]).toBe(0x63);
    expect(d.mem8[sbox_addr + 0xf1]).toBe(0xa1);

    // aes 256
    const AES_256_KEY_SIZE = 8 * 4;
    // const AES_256_EXPANDED_KEY_SIZE = 240;

    const memcpyTo = (what: number[], addr: number) => {
      for (let i = 0; i < what.length; i++) {
        d.mem8[addr + i] = what[i];
      }
    };

    const key_adds = d.compiled._debug_get_heap_offset();
    memcpyTo(key_expansion_cipher_key_256, key_adds);
    const key_expranded_addr = 9200;
    d.compiled.fill_key_expansion(
      key_adds,
      AES_256_KEY_SIZE,
      key_expranded_addr
    );

    expect(d.mem8[key_expranded_addr + 0]).toBe(0x60);
    expect(d.mem8[key_expranded_addr + 8]).toBe(0x2b);
    expect(d.mem8[key_expranded_addr + 8 * 10]).toBe(0xb5);

    // aes 256 encryption
    memcpyTo(cipher_key_256, key_adds);
    d.compiled.fill_key_expansion(
      key_adds,
      AES_256_KEY_SIZE,
      key_expranded_addr
    );
    const block_addr = d.compiled._debug_get_heap_offset() + 1000;
    memcpyTo(block_to_encrypt, block_addr);
    d.compiled.aes_encrypt_block(
      block_addr,
      key_expranded_addr,
      AES_256_KEY_SIZE
    );
    expect(Array.from(d.mem8.slice(block_addr, block_addr + 16))).toStrictEqual(
      encrypted_block
    );
  });
});

const key_expansion_cipher_key_256 = [
  0x60, 0x3d, 0xeb, 0x10, 0x15, 0xca, 0x71, 0xbe, 0x2b, 0x73, 0xae, 0xf0, 0x85,
  0x7d, 0x77, 0x81, 0x1f, 0x35, 0x2c, 0x07, 0x3b, 0x61, 0x08, 0xd7, 0x2d, 0x98,
  0x10, 0xa3, 0x09, 0x14, 0xdf, 0xf4,
];

const cipher_key_256 = [
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
  0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19,
  0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
];

const block_to_encrypt = [
  0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc,
  0xdd, 0xee, 0xff,
];
const encrypted_block = [
  0x8e, 0xa2, 0xb7, 0xca, 0x51, 0x67, 0x45, 0xbf, 0xea, 0xfc, 0x49, 0x90, 0x4b,
  0x49, 0x60, 0x89,
];
