

const char BIT_LEN = 8;

/** Table of bytes with bits in inverse order */
char _inverse_bits[256];

char _inverse_bits_for_byte(char a)
{
  char r = 0;
  for (char i = 0; i < 8; i++)
  {
    if ((a >> i) & 1)
    {
      r = r + (1 << (7 - i));
    }
  }
  return r;
};

void _init_inverse_bits_table()
{
  _inverse_bits[0x00] = _inverse_bits_for_byte(0x00);
  for (unsigned char i = 0xFF; i > 0; i--)
  {
    _inverse_bits[i] = _inverse_bits_for_byte(i);
  };
};

char poly = 0b00011011;
char poly_inversed = 0b11011000;

/** Multiplication of two charnoms in GF2, bits are inversed */
char char_multiple_inversed(char a, char b)
{

  char window = 0;

  // Go through highest degree to lowest
  for (char i = 0; i < BIT_LEN; i++)
  {
    char bit_value = (b >> i) & 1;

    // printf("Bit as pos %i value=%i\n", i, bit_value);
    if (bit_value == 1)
    {
      // Bit is set. This means that we should add
      //  (a * x^(31-i)) % char
      // into result

      // Our window is shifted left now for 31-i items
      // This means it is already multiplied by x^(31-i)
      // So, we just adding "a" into window

      // printf("  Adding 'a' to window. Before=0x%08x after=0x%08x\n", window, window ^ a);
      window = window ^ a;
    }

    // If it is not the last cycle, then we need to shift window
    // TODO: We can optimize this by altering loop, i.e.
    //  we can have a loop with 31 iteraction but do copy-pasted things before the loop.
    //  This might bring some performance.
    if (i != BIT_LEN - 1)
    {
      // Now prepare for shift
      char window_highest_degree_bit = window & 1;
      // printf("  window=0x%08x shiftedWindow=0x%08x shiftedBit=%i\n", window, window >> 1, window_highest_degree_bit);
      window = window >> 1;
      if (window_highest_degree_bit == 1)
      {
        window = window ^ poly_inversed;
        // printf("  windowAftercharXor=0x%08x\n", window);
      }
    }
  }

  return window;
};

/** Multiplication of two charnoms in GF2 */
char char_multiple(char a, char b)
{

  char window = 0;

  // Go through highest degree to lowest
  for (char i = BIT_LEN - 1; i >= 0; i--)
  {
    char bit_value = (b >> i) & 1;

    // printf("Bit as pos %i value=%i\n", i, bit_value);
    if (bit_value == 1)
    {
      // Bit is set. This means that we should add
      //  (a * x^(31-i)) % char
      // into result

      // Our window is shifted left now for 31-i items
      // This means it is already multiplied by x^(31-i)
      // So, we just adding "a" into window

      // printf("  Adding 'a' to window. Before=0x%08x after=0x%08x\n", window, window ^ a);
      window = window ^ a;
    }

    // If it is not the last cycle, then we need to shift window
    // TODO: We can optimize this by altering loop, i.e.
    //  we can have a loop with 31 iteraction but do copy-pasted things before the loop.
    //  This might bring some performance.
    if (i != 0)
    {
      // Now prepare for shift
      char window_highest_degree_bit = (window >> (BIT_LEN - 1)) & 1;
      // printf("  window=0x%08x shiftedWindow=0x%08x shiftedBit=%i\n", window, window >> 1, window_highest_degree_bit);
      window = window << 1;
      if (window_highest_degree_bit == 1)
      {
        window = window ^ poly;
        // printf("  windowAftercharXor=0x%08x\n", window);
      }
    }
  }

  return window;
};

// #include <stdio.h>
// void print_bits(char a)
// {
//        for (char i = 0; i < 8; i++)
//        {
//               printf((a >> (7 - i)) & 1 ? "1" : "0");
//        };
// };

char char_divide(char a, char b, char a_have_highest_bit, char *q, char *r)
{
  // printf("\nDivide ");
  // printf(a_have_highest_bit ? "1." : "0.");
  // print_bits(a);
  // printf(" by ");
  // print_bits(b);
  // printf("\n");

  char local_q;
  char local_r;

  char next_q;
  char next_r;

  for (char i = BIT_LEN; i >= 0; i--)
  {
    if ((i == BIT_LEN && a_have_highest_bit) || ((a >> i) & 1))
    {
      for (char ii = (i == BIT_LEN ? i - 1 : i); ii >= 0; ii--)
      {
        if ((b >> ii) & 1)
        {
          // printf("Found div i=%i ii=%ii\n", i, ii);
          local_q = 1 << (i - ii);
          local_r = a ^ (b << (i - ii));

          // printf("Local_q = ");
          // print_bits(local_q);
          // printf("  local_r = ");
          // print_bits(local_r);
          // printf("\n");

          char_divide(local_r, b, 0, &next_q, &next_r);
          *q = local_q ^ next_q;
          *r = next_r;
          // printf("Return q = ");
          // print_bits(*q);
          // printf("  r = ");
          // print_bits(*r);
          // printf("\n");
          return 0;
        };
      };
      // printf("Error: b is zero\n");
      *q = 0;
      *r = 0;
      return 1;
    };

    if ((b >> i) & 1)
    {
      //     printf("Found non-zero at b at %i pos, b is greater than a. Finished\n", i);
      // We found a non-zero value at b, but still not value at a
      // This means search is over, deg(b) > deg(a)
      *q = 0;
      *r = a;
      return 0;
    };
  }

  // printf("Lol: a is zero\n");
  *q = 0;
  *r = 0;
  return 0;
};

/** 
 * Assume that deg(a) is always bigger than deg(b)
 * */
char _get_bezout_identity(char a, char b, char a_have_highest_bit, char *x, char *y)
{
  if (b == 0b1)
  {
    *x = 0;
    *y = 1;
    return 0;
  }
  char q;
  char r;
  if (char_divide(a, b, a_have_highest_bit, &q, &r))
  {
    *x = 0;
    *y = 0;
    return 1;
  };

  if (r == 0b0)
  {
    // This should never happen
    *x = 0;
    *y = 0;
    return 2;
  };
  if (r == 0b1)
  {
    // Which means deg(r) = 0
    *x = 0b1;
    *y = q;
    return 0;
  };

  if (q == 0)
  {
    // This means deg(a) was lower than def(b)
    *x = 0;
    *y = 0;
    return 3;
  };

  char xx;
  char yy;

  char err = _get_bezout_identity(b, r, 0, &xx, &yy);
  if (err)
  {
    return err;
  };

  *x = yy;
  // Degree of multiplication show be less than deg(a)
  *y = xx ^ char_multiple(q, yy);
  return 0;
};

char get_inverse_element(char b)
{
  char x;
  char y;

  char err = _get_bezout_identity(poly, b, 1, &x, &y);
  if (err)
  {
    return 0;
  };
  return y;
};
