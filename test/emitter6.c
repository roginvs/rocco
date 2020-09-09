int compare_eq(int i, int j)
{
  return i == j;
}

int factor(int i)
{
  if (i == 1)
  {
    return i;
  }
  else
  {
    return i * factor(i - 1);
  }
}

int op_s(int type, signed int x, signed int y)
{
  if (type == 0)
    return x > y;
  else if (type == 1)
    return x >= y;
  else if (type == 2)
    return x < y;
  else if (type == 3)
    return x <= y;
  else if (type == 4)
    return x == y;
  else if (type == 5)
    return x != y;
  else if (type == 6)
    return x ^ y;

  return -1;
}

int op_u(int type, unsigned int x, unsigned int y)
{
  if (type == 0)
    return x > y;
  else if (type == 1)
    return x >= y;
  else if (type == 2)
    return x < y;
  else if (type == 3)
    return x <= y;
  else if (type == 4)
    return x == y;
  else if (type == 5)
    return x != y;
  else if (type == 6)
    return x ^ y;
  else if (type == 7)
    return x || y;
  else if (type == 8)
    return x && y;

  return -1;
}