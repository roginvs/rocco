/**
 
gcc -Wall -o simpleunit.bin simpleunit.c

*/

int i;

char arr[30];

void func1()
{
  i = i + 1;
  arr[i] = i * 2;
}

int func2(int idx)
{
  static int staticcounter = 5 + 3;
  staticcounter += 1;

  if (idx > 10)
  {
    return arr[idx] + 9;
  }
  else
  {
    return arr[idx] + 4;
  }
}

int j1 = 2, j2 = 4;

int j3, j4 = 3;

void func3()
{
  int j5 = 2, j6 = j5 + 3;
}; // A ; symbol

int main()
{
  func1();
  func2(3);

  return 3;
}