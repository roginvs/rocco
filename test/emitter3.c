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

int is_value_eleven(int i)
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