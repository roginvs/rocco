char arr[10];

/** 
 * Returns i*2 + 4
 * */
int compound_expression(int i)
{
  int j = i;
  j = j + 1;
  {
    int k;
    k = i + 3;
    j = j + k;
  }
  return j;
}

int compound_expression_return(int i)
{
  int j = i;
  {
    int k = j + 1;
    return k;
  }
  return 999;
}

int is_value_eleven_1(int i)
{
  if (i - 11)
  {
    return 111;
  }
  else
  {
    // Value is eleven
    return 222;
  }
}

int is_value_eleven_2(int i)
{
  if (i - 11)
  {
    return 111;
  };
  // Value is eleven
  return 222;
}

int is_value_eleven_3(int i)
{
  int j;
  if (i - 11)
    j = 110;
  else
    // Value is eleven
    j = 221;
  j = j + 1;
  return j;
}

int for_loop_1()
{
  int s = 100;
  // (10 - i)  is the same as  !(i == 10)
  for (int i = 0; 10 - i; i = i + 1)
  {
    s = s + i;
  };
  return s;
}

int for_loop_2()
{
  int s = 100;

  int i = 0;
  while (19)
  {
    if (10 - i)
    {
      // do nothing
    }
    else
    {
      break;
    }
    s = s + i;

    i = i + 1;
  }
  return s;
}

int for_loop_3()
{
  int s = 100;
  int i = 0;
  for (;;)
  {
    if (5 - i)
    {
    }
    else
    {
      if (11)
      {
        i = i + 1;
        continue;
      }
    };

    if (10 - i)
    {
      // do nothing
    }
    else
    {
      break;
    }
    s = s + i;

    i = i + 1;
  }
  return s + 5;
}