/**
 
gcc -Wall -o casting.bin casting.c

*/

int long i;
int *p;

int func(int x)
{
  return x + 1;
}

int main()
{
  unsigned char c;
  // No casting needed
  c = i;
  float f = i;
  i = f;

  // Casting example
  p = (int *)i;

  p = (void *)i;

  // No even warning here?
  i = (char)p;

  i = *((char *)&i + 1);

  p = (int *)((int long *)(void *)&i + 1);

  // A pointer to function
  int (*pf)(int xxx) = &func;

  // Casting to pointer to function
  pf = (int (*)(int))p;

  // Suppress "Unused variables" warning in gcc
  c = c + 1;
  f = f + 1;
  return 0;
}