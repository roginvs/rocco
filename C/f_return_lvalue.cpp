
int x;

// This works only in cpp mode
int &f_return_lvalue()
{
  return x;
};

void test1()
{
  f_return_lvalue() = 4;
};

void test2()
{
  int a;
  int b;
  1 ? a : b = 10;
}

int main()
{
  return 0;
}