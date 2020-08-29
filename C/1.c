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
};

void test8()
{
  int x = 2;
  if (x = 2, 4)
  {
  };

  typedef char TTT[20];

  TTT y;

  struct TTT *unknown_struct;

  struct TTT1
  {
    /* data */
  };
};

void test9()
{
  const void *c;

  //

  //ccccc = test9;
}

void test10(t, t2) int t;
int t2;
{
  // K&R C
}

// This is an error "a parameter list without types is only allowed in a function definition"
// void test11(t, t2);

int test12(register char c())
{
  //

  char (*(*p)[])(int *param1, int param2(), ...);

  //int a = b = 2;
};

int test13(int n, int arr[static 4]);
int test13(int n2, int arr[static n2])
{

  arr[n2] = 2;
};
void test14(int i, int i2)
{
  char c = 3;
  int arr[2];
  test13(1, arr);
}

extern void test14();
extern char test14char[20];

void test15()
{

  // struct Kek kek;

  struct Kek
  {
    int a;
    int b;
  };

  struct Kek kek;
}
void test16(char kek[])
{
  //asd
  int *addr = &kek;

  extern char kekekek[];
}

// unnamed prototyped parameters not allowed when body is present
/*
void test13(char)
{
  // kek
}
*/

void test17()
{
id1:;

  int id1 = 22;

  goto id1;
}

void test18()
{
  struct Arr1
  {
    char arr[5];
  };
  struct Arr2
  {
    char arr[5];
  };

  char arr1[5];
  char arr2[5];

  // Error here
  //arr1 = arr2;

  struct Arr1 s1;
  struct Arr1 s2;
  s1 = s2;
}

void test19()
{
  char arr[] = {1, 2, 3};
  //char arr2[];

  // Hmm
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
