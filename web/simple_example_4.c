
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
