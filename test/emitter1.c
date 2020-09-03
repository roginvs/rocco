
int x = 333;
int y;

int arr1[10];

char arr2[10];

char arr3[5][6];

char c;
int z = 402 + 1;

void void_func()
{
  // do nothing
}

int return_const()
{
  static int arr4[5];

  int x = 20 + 21;
  int y = 30;

  return x;
}

int counter()
{
  static int counts = 0;
  counts = counts + 1;
  return counts;
}