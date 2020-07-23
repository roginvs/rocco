/*

gcc -Wall -o 1.bin 1.c

clang -Xclang -ast-dump 1.c

*/

int test(char a, char *b, char **c)
{
  a *= 2;
  b = (char *)2;

  int kek2 = 4;

  typedef int kek1;

  int zzz100 = 100;

  int size1 = sizeof(kek1);

  int zzz200 = 200;

  int size2 = sizeof(kek2);
  // b-- -----;
  return 3;
};
int test2()
{
  struct S1
  {
    int a1;
    int a2;
    int a3
  } s1;

  struct S2
  {
    int b1;
    int b2;
    int b3
  } p = (struct S2)s1;

  //struct SSS pp;

  return 3;
};

int main(int argc, char **argv)
{
  int x = 1 + argc;
  int y = 2;

  int z[x];
  return 0;
}
