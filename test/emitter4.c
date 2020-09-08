
int multiply_by_2(int i)
{
  return i * 2;
}

int call_simple_1(int i)
{
  return multiply_by_2(i) + 1;
}

int multiply_by_2_first_and_add_second(int i, int j)
{
  return i * 2 + j;
}

int call_simple_2(int i, int j)
{
  return multiply_by_2_first_and_add_second(i, j);
}

int add_eleven(int *p)
{
  (*p) = (*p) + 11;
};

int call_simple_3(int i)
{
  add_eleven(i);
  return i;
}