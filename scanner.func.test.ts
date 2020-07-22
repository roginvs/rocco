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
`;

describe("Scanner", () => {
  it(`Scans`, () => {
    const scanner = createScannerFunc(fdata);

    while (true) {
      const token = scanner();

      if (token.type === "end") {
        break;
      } else if (token.type === "keyword" && token.keyword === "return") {
        expect(token.length).toStrictEqual(6);
        expect(token.line).toStrictEqual(27);
        expect(token.pos).toStrictEqual(3);
      }
    }
  });
  it(`Scans simple 123`, () => {
    const scanner = createScannerFunc("123");
    expect(scanner()).toMatchObject({
      type: "const",
      subtype: "int",
      value: 123,
    });
  });
});
