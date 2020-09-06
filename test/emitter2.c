
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

int int_identity(int x)
{
  return x;
}
int int_sum(int x, int y)
{
  return x + y;
}

void change_chars_array(int idx, char value)
{
  arr_chars[idx] = value;
}

void change_ints_array(int idx, int value)
{
  arr_ints[idx] = value;
}

int array_on_stack()
{
  // TODO
  char arr[13];
  arr[0] = 1;
}
