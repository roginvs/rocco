/*

gcc -Wall -o 2.bin 2.c && ./2.bin

clang -Xclang -ast-dump 2.c

*/

void test_array(int x, int y, int z)
{
  char myarr[x][y][z];
  myarr[1][2][3] = 22;

  // (myarr[1]) <- this is array of y elements of z chars each
}



#include "../test/emitter3.c"
#include <stdio.h>

int main()
{
  printf("for_loop_1 = %i\n", for_loop_1());
  printf("for_loop_2 = %i\n", for_loop_2());
  return 0;
}