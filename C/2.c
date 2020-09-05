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

int main()
{
  return 0;
}