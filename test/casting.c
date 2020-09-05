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
  // No casting needed, and no warning here!
  c = i;
  float f = i;
  i = f;
  i = (2.3 + 0.1);
  // i = 2.3; <- this shows warning
  i = 5 / 2;

  // Without casting it shows warning:
  //   incompatible pointer types assigning to 'int *' from 'unsigned char *'
  p = &c;

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