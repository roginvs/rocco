/*

gcc -Wall -o 2.bin 2.c && ./2.bin

clang -Xclang -ast-dump 2.c


# compile with docker image
docker run \
  --rm \
  -v $(pwd):/src \
  -u $(id -u):$(id -g) \
  emscripten/emsdk \
  emcc 2.c -o out/1.html


*/

void test_array(int x, int y, int z)
{
  char myarr[x][y][z];
  myarr[1][2][3] = 22;

  // (myarr[1]) <- this is array of y elements of z chars each
}

#include "../test/emitter3.c"
#include <stdio.h>

void test_func_address_add(int i)
{
  char(*p1)[3] = 1000;
  char(*p2)[] = 1000;
  printf("test_array address     = %lu\n", &test_array);
  printf("test_array address + 1 = %lu\n", &test_array + 1);
  // printf("test_array address [1] = %lu\n", (&test_array)[1]);
  printf("pointer to array with known size     = %lu\n", p1);
  printf("pointer to array with known size + 1 = %lu\n", p1 + 1);
  printf("pointer to array with known size [1] = %lu\n", p1[1]);
  printf("pointer to array with unknown size     = %lu\n", p2);
  // printf("pointer to array with unknown size + 1 = %lu\n", p2 + 1);
  // printf("pointer to array with unknown size [1] = %lu\n", p2[1]);

  char(*p3)[i] = 1000;
  i = 500;
  printf("pointer to array with dynamic size     = %lu\n", p3);
  printf("pointer to array with dynamic size + 1 = %lu\n", p3 + 1);
  printf("pointer to array with dynamic size [1] = %lu\n", p3[1]);
}

void test_pointers()
{
  int i;
  int j;
  int *p1;
  int *p2;

  p1 = &i;
  p2 = &(*p1);
}

void test_char_arithmetic()
{
  char c1 = 250;
  char c2 = 100;
  char c3 = c1 + c2;
  int i = c1 + c2;
  printf("Values are c3=%i int=%i\n", c3, i);
}

int main()
{
  printf("for_loop_1 = %i\n", for_loop_1());
  printf("for_loop_2 = %i\n", for_loop_2());
  printf("for_loop_3 = %i\n", for_loop_3());
  test_func_address_add(10);
  test_char_arithmetic();
  return 0;
}