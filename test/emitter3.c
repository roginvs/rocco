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