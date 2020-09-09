/*

gcc -Wall -o 3.bin 3.c && ./3.bin

clang -Xclang -ast-dump 3.c


# compile with docker image
docker run \
  --rm \
  -v $(pwd):/src \
  -u $(id -u):$(id -g) \
  emscripten/emsdk \
  emcc 3.c -o out/3.html


*/

#include <stdio.h>

void test_char_arithmetic()
{
  unsigned char c1 = 250;
  unsigned char c2 = 100;
  unsigned char c3 = c1 + c2;
  unsigned int i = c1 + c2;
  // WasmExplorer does i32.and 0xFF ... to cast to char
  unsigned int i2 = (unsigned char)(c1 + c2);
  printf("Values1 are c3=%i int=%i int2=%i\n", c3, i, i2);
}

void test_postfix_op()
{
  int i = 2;
  int *p = &i;
  printf("\n");
  printf("  p = %lu\n", p);
  p++;
  printf("  p = %lu\n", p);
  // i++ = 2;
}

void test_shift()
{
  unsigned int i = 0xf0ff00f0;
  int j = 8;
  printf(" >> = %i\n", i >> j);
}

int main()
{

  test_char_arithmetic();
  test_postfix_op();
  test_shift();
  return 0;
}