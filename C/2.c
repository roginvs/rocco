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

void test_dynamic_arrays_sizes(int i, int j)
{
  // Element size is saved somewhere
  char arr1[i][j];
  i = 1000;
  j = 10000;
  printf("Address of [0] = %lu\n", &arr1[0]);
  printf("Address of [1] = %lu\n", &arr1[1]);
  printf("  Diff = %lu\n", (long int)&arr1[1] - (long int)&arr1[0]);

  // Elements size is also calculated during cast
  printf("Casted [0] = %lu\n",
         &(*(
             (char(*)[i * 2][j * 2]) & arr1))[0]);
  printf("Casted [1] = %lu\n",
         &(*(
             (char(*)[i * 2][j * 2]) & arr1))[1]);
  printf("  casted diff = %lu\n",
         (long int)(&(*(
             (char(*)[i * 2][j * 2]) & arr1))[1]) -
             (long int)(&(*(
                 (char(*)[i * 2][j * 2]) & arr1))[0]));

  // And elements size is saved during declaration of pointer to array of arrays
  char(*arr2)[i * 3][j * 3] = (void *)0;
  i = 1;
  j = 2;

  printf("Declared [0] = %lu\n",
         &((*arr2)[0]));
  printf("Declared [1] = %lu\n",
         &((*arr2)[0]));
  printf("  diff Declared = %lu\n",
         (long int)&((*arr2)[1]) -
             (long int)&((*arr2)[0])

  );
}

int main()
{
  printf("for_loop_1 = %i\n", for_loop_1());
  printf("for_loop_2 = %i\n", for_loop_2());
  printf("for_loop_3 = %i\n", for_loop_3());
  test_func_address_add(10);
  test_char_arithmetic();

  test_dynamic_arrays_sizes(10, 100);
  return 0;
}