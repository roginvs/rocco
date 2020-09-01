/**
 
gcc -Wall -o simpleunit.bin simpleunit.c

*/

int i;
int j = 2, k = 4;

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

int main()
{
  func1();
  func2(3);

  return 3;
}