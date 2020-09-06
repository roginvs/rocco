/*

gcc -Wall -o 2.bin 2.c

clang -Xclang -ast-dump 2.c

*/

void test_array(int x, int y, int z)
{
  char myarr[x][y][z];
  myarr[1][2][3] = 22;

  // (myarr[1]) <- this is array of y elements of z chars each
}

int for_loop_1()
{
  int s = 100;
  // (10 - i)  is the same as  !(i == 10)
  for (int i = 0; 10 - i; i = i + 1)
  {
    s = s + i;
  };
  return s;
}

#include <stdio.h>

int main()
{
  printf("for_loop_1 = %i\n", for_loop_1());
  return 0;
}