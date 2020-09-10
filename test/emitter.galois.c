/*

A copy-paste from 
 - https://github.com/roginvs/test_crypto/blob/master/galois.c

Changes:
  - macroses removed
  - types changed into "unsigned char"
  - added function to get address of _inverse_bits_address
*/

typedef unsigned char uint8_t;
typedef signed char int8_t;

const uint8_t BIT_LEN = 8;

typedef uint8_t Poly;

/** Table of bytes with bits in inverse order */
uint8_t _inverse_bits[0x100];

uint8_t _inverse_bits_for_byte(uint8_t a)
{
  uint8_t r = 0;
  for (uint8_t i = 0; i < 8; i++)
  {
    if ((a >> i) & 1)
    {
      r = r + (1 << (7 - i));
    }
  }
  return r;
};

uint8_t *_inverse_bits_address()
{
  return &_inverse_bits[0];
}

void _init_inverse_bits_table()
{
  _inverse_bits[0x00] = _inverse_bits_for_byte(0x00);
  for (uint8_t i = 0xFF; i > 0; i--)
  {
    _inverse_bits[i] = _inverse_bits_for_byte(i);
  };
};

Poly poly = 0b00011011;
Poly poly_inversed = 0b11011000;

/** Multiplication of two polynoms in GF2, bits are inversed */
Poly poly_multiple_inversed(Poly a, Poly b)
{

  Poly window = 0;

  // Go through highest degree to lowest
  for (uint8_t i = 0; i < BIT_LEN; i++)
  {
    uint8_t bit_value = (b >> i) & 1;

    // printf("Bit as pos %i value=%i\n", i, bit_value);
    if (bit_value == 1)
    {
      // Bit is set. This means that we should add
      //  (a * x^(31-i)) % poly
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
      uint8_t window_highest_degree_bit = window & 1;
      // printf("  window=0x%08x shiftedWindow=0x%08x shiftedBit=%i\n", window, window >> 1, window_highest_degree_bit);
      window = window >> 1;
      if (window_highest_degree_bit == 1)
      {
        window = window ^ poly_inversed;
        // printf("  windowAfterPolyXor=0x%08x\n", window);
      }
    }
  }

  return window;
};

/** Multiplication of two polynoms in GF2 */
Poly poly_multiple(Poly a, Poly b)
{

  Poly window = 0;

  // Go through highest degree to lowest
  for (int8_t i = BIT_LEN - 1; i >= 0; i--)
  {
    uint8_t bit_value = (b >> i) & 1;

    // printf("Bit as pos %i value=%i\n", i, bit_value);
    if (bit_value == 1)
    {
      // Bit is set. This means that we should add
      //  (a * x^(31-i)) % poly
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
      uint8_t window_highest_degree_bit = (window >> (BIT_LEN - 1)) & 1;
      // printf("  window=0x%08x shiftedWindow=0x%08x shiftedBit=%i\n", window, window >> 1, window_highest_degree_bit);
      window = window << 1;
      if (window_highest_degree_bit == 1)
      {
        window = window ^ poly;
        // printf("  windowAfterPolyXor=0x%08x\n", window);
      }
    }
  }

  return window;
};

// #include <stdio.h>
// void print_bits(uint8_t a)
// {
//        for (uint8_t i = 0; i < 8; i++)
//        {
//               printf((a >> (7 - i)) & 1 ? "1" : "0");
//        };
// };

uint8_t poly_divide(Poly a, Poly b, uint8_t a_have_highest_bit, Poly *q, Poly *r)
{
  // printf("\nDivide ");
  // printf(a_have_highest_bit ? "1." : "0.");
  // print_bits(a);
  // printf(" by ");
  // print_bits(b);
  // printf("\n");

  Poly local_q;
  Poly local_r;

  Poly next_q;
  Poly next_r;

  for (int8_t i = BIT_LEN; i >= 0; i--)
  {
    if ((i == BIT_LEN && a_have_highest_bit) || ((a >> i) & 1))
    {
      for (int8_t ii = (i == BIT_LEN ? i - 1 : i); ii >= 0; ii--)
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

          poly_divide(local_r, b, 0, &next_q, &next_r);
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
uint8_t _get_bezout_identity(Poly a, Poly b, uint8_t a_have_highest_bit, Poly *x, Poly *y)
{
  if (b == 0b1)
  {
    *x = 0;
    *y = 1;
    return 0;
  }
  Poly q;
  Poly r;
  if (poly_divide(a, b, a_have_highest_bit, &q, &r))
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

  Poly xx;
  Poly yy;

  uint8_t err = _get_bezout_identity(b, r, 0, &xx, &yy);
  if (err)
  {
    return err;
  };

  *x = yy;
  // Degree of multiplication show be less than deg(a)
  *y = xx ^ poly_multiple(q, yy);
  return 0;
};

Poly get_inverse_element(Poly b)
{
  Poly x;
  Poly y;

  uint8_t err = _get_bezout_identity(poly, b, 1, &x, &y);
  if (err)
  {
    return 0;
  };
  return y;
};
