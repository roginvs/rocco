import { createScannerFunc } from "./scanner.func";

const fdata = `
/*

gcc -Wall -o 1.bin 1.c

*/

int test(char a, char *b, char **c)
{
  a *= 2;
  b = 2;
  typedef int kek;
  // int kek = 4;

  //  a = kek;
  a = (kek)100;

  // b-- -----;
};

int main(int argc, char **argv)
{
  int x = 1 + argc;
  int y = 2;

  int z[x];
  return 0;
}

int kek = 0x5F2;
int lol = 0b11010011;

`;

describe("Scanner", () => {
  it(`Scans`, () => {
    const scanner = createScannerFunc(fdata);

    let checksCounts = 0;

    while (true) {
      const token = scanner();

      if (token.type === "end") {
        break;
      } else if (token.type === "return") {
        expect(token.length).toStrictEqual(6);
        expect(token.line).toStrictEqual(27);
        expect(token.pos).toStrictEqual(3);
        checksCounts++;
      } else if (token.type === "const-expression") {
        if (token.value === 0x5f2) {
          checksCounts++;
        } else if (token.value === 0b11010011) {
          checksCounts++;
        }
      }
    }

    expect(checksCounts).toBe(3);
  });
  it(`Scans simple 123`, () => {
    const scanner = createScannerFunc("123");
    expect(scanner()).toMatchObject({
      type: "const-expression",
      subtype: "int",
      value: 123,
    });
  });

  it(`Scans simple 0x1F34`, () => {
    const scanner = createScannerFunc("0x1F34");
    expect(scanner()).toMatchObject({
      type: "const-expression",
      subtype: "int",
      value: 0x1f34,
    });
  });

  it(`Scans with ellipsis`, () => {
    const scanner = createScannerFunc("int printf( const char* format, ... );");
    while (true) {
      const token = scanner();
      if (token.type === "end") {
        break;
      } else if (token.type === "return") {
        // LOL: This is unused!
        expect(token.length).toStrictEqual(6);
        expect(token.line).toStrictEqual(27);
        expect(token.pos).toStrictEqual(3);
      }
    }
  });
});
