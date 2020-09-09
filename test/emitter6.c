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
