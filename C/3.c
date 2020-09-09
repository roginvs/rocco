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
  printf("Values1 are c3=%i int=%i\n", c3, i);
}

int main()
{

  test_char_arithmetic();
  return 0;
}