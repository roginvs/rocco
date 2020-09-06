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
