
char arr_chars[9];
int arr_ints[11];

int get_arr_chars_size()
{
  return sizeof arr_chars;
}

int get_arr_ints_size()
{
  return sizeof arr_ints;
}

int get_arr_chars_address()
{
  return &arr_chars;
}

int get_arr_ints_address()
{
  return &arr_ints;
}

int get_hacky_esp()
{
  // We know that local variable will be on the stack, and nothing else
  // This is compiler-specific thing
  int x;
  return (int)&x;
}

int array_on_stack()
{
  char arr1[13];
}