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
  // Really need initializer
  static int staticcounter;
  staticcounter = 3;

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