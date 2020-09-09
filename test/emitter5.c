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

int bitwise_reverse(int i)
{
  return ~i;
}
int not(int i)
{
  return !i;
}
int minus(int i)
{
  return -i;
}
int plus(int i)
{
  return +i;
}

int shl(int i, int j)
{
  return i << j;
}
int shr_s(signed int i, int j)
{
  return i >> j;
}
int shr_u(unsigned int i, int j)
{
  return i >> j;
}