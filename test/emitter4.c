
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