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

  /*
  struct S2
  {
    int b1;
    int b2;
    int b3
  } p = (struct S2)s1;
  */

  //struct SSS pp;

  return 3;
};

struct TestS
{
  int x;
  int y;
  struct Test6
  {
    int a;
    int b;
  } s;
};

struct TestS test_struxts()
{
  struct TestS r;
  r.s.a = 2;

  return r;
};

void test3()
{
  int c = 3, d = c;
};

int z;
char f(z)
{
  return 2;
};

void test5()
{
  int x = 4;
  int y = 4;
  char arr[x = 6];
};

void test6()
{
  int i = 2;

  int *p = &i;
  *p = 22;
  char array[*p];

  int ii = 4;

  //int x =
  int x;
  int y;
  //x || y = 2;
  //f_return_lvalue() = 3;
};

void test7()
{
  struct T1
  {
    int a;
    int b;
  };
  struct T2
  {
    int a;
    int b;
  };

  struct T1 t1;
  struct T1 t2;
  t1 = t2;

  // asd
}

int main(int argc, char **argv)
{
  int x = 1 + argc;
  int y = 2;

  //char static xxxx;

  // pointer to an array
  char(*kek1)[3];

  // array of pointers
  char *kek22222[3];

  (*kek1)[1] = 2;
  kek22222[3] = &y;

  // *kek1 = 2;
  f();

  //(char *[]) kkkk = 3;

  int ssss = sizeof(char([2]));

  int z[x];

  return 0;
}
