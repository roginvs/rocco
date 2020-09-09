int postfix_plusplus(int i)
{
  int j = i++;
  // j === i

  return i + j;
}

/** Must return 20 */
int postfix_plusplus_array()
{
  int arr[5]; // size = 20
  int(*p1)[5] = &arr;
  int(*p2)[5] = p1;
  p2++;

  int diff = (int)p2 - (int)p1;

  return diff;
}

int postfix_minusminus(int i)
{
  int j = i--;
  // j === i

  return i + j;
}

int sizeof_typename()
{
  return sizeof(int[5]);
}