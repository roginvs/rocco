
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

void add_eleven_to_pointer(int *p_to_int)
{
  (*p_to_int) = (*p_to_int) + 11;
};

int call_simple_3(int i)
{
  add_eleven_to_pointer(&i);
  return i;
}

void add_twenty_to_pointer(int *p_to_int)
{
  (*p_to_int) = (*p_to_int) + 20;
};

int call_simple_4(int i, int j)
{
  void (*p1)(int *) = &add_eleven_to_pointer;
  void (*p2)(int *) = &add_twenty_to_pointer;
  void (*p)(int *) = (void *)0;
  if (j)
  {
    p = p1;
  }
  else
  {
    p = p2;
  }

  (*p)(&i);

  return i;
}

int trap()
{
  void (*p)() = (void *)0;
  (*p)();
  return 111;
}

int call_simple_5(int i, int j)
{
}