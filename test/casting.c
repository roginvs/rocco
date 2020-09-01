/**
 
gcc -Wall -o casting.bin casting.c

*/

long int i;
int *p;

int main()
{
  unsigned char c;
  // No casting needed
  c = i;
  float f = i;

  // Casting example
  p = (int *)i;

  p = (void *)i;

  // No even warning here?
  i = (char)p;

  i = *((char *)&i + 1);

  p = (int *)((long int *)(void *)&i + 1);

  c = c + 1;
  f = f + 1;
  return 0;
}