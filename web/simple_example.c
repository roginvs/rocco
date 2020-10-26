

// This code does nothing usefull
// It is just a demo of compiler features

// Simple summ
int summ(int i, int j)
{
  return i + j;
}

// Multiplication which adds distortion
// Static variables are supported too
int multiply(int i, int j)
{
  static int distortion = 0;
  int result = i * j + distortion;
  distortion++;
  return result;
}

void arrays_and_pointers(int i)
{
  // Array of array of pointers to function
  char (*(array[10][20]))(int, int);

  if (i < 10)
  {
    array[i][0] = (void *)0;
  }
  else if (i > 100)
  {
    return;
  }

  // Address of functions
  array[0][0] = &multiply;
  array[0][1] = &summ;

  // Call function by address
  int r = (*(i % 2 == 0 ? array[0][0] : array[0][1]))(7, 9);
}

void strcpy(char *s, const char *t)
{
  while (*s++ = *t++)
    ;
}