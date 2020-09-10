/*


This is AES encryption implemenation

A copy-paste from (here you can find details)
 - https://github.com/roginvs/test_crypto/blob/master/galois.c
 - https://github.com/roginvs/test_crypto/blob/master/aes.c

Changes:
  - macroses removed
  - all files manually concatenated to one file
  - types changed into "unsigned char"
  - added function to get address of _inverse_bits_address
  
  - switch is replaced if-else
  - array in "+" operator changed to address of array
  - array in function argument is transformed to pointer to first array element (x -> &x[0])
    
*/

//  galois.c

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

// ============== aes.c ==============

uint8_t byte_cyclic_left_shift(uint8_t x, uint8_t i)
{
  return (x << i) | (x >> (8 - i));
};

uint8_t _calc_sbox(uint8_t x)
{
  uint8_t b = x != 0 ? get_inverse_element(x) : 0;
  uint8_t s = b ^ byte_cyclic_left_shift(b, 1) ^
              byte_cyclic_left_shift(b, 2) ^
              byte_cyclic_left_shift(b, 3) ^
              byte_cyclic_left_shift(b, 4) ^ 0x63;
  return s;
};

uint8_t _sbox[0x100];

uint8_t *_address_sbox()
{
  return &_sbox[0];
}

uint8_t _inv_sbox[0x100];
void _init_sbox()
{
  uint8_t val;

  val = _calc_sbox(0x00);
  _sbox[0x00] = val;
  _inv_sbox[val] = 0x00;

  for (uint8_t i = 0xFF; i != 0; i--)
  {
    val = _calc_sbox(i);
    _sbox[i] = val;
    _inv_sbox[val] = i;
  };
}

typedef uint8_t *Block;
typedef uint8_t *Word;
const uint8_t WORD_SIZE = 4;
const uint8_t WORDS_IN_BLOCK = 4;
const uint8_t BLOCK_SIZE = WORD_SIZE * WORDS_IN_BLOCK;

void SubBytes(Block b)
{
  for (uint8_t i = 0; i < BLOCK_SIZE; i++)
  {
    b[i] = _sbox[b[i]];
  }
};

void InvSubBytes(Block b)
{
  for (uint8_t i = 0; i < BLOCK_SIZE; i++)
  {
    b[i] = _inv_sbox[b[i]];
  }
};

void ShiftRows(Block b)
{
  uint8_t c;

  c = b[13];
  b[13] = b[1];
  b[1] = b[5];
  b[5] = b[9];
  b[9] = c;

  c = b[14];
  b[14] = b[6];
  b[6] = c;

  c = b[10];
  b[10] = b[2];
  b[2] = c;

  c = b[15];
  b[15] = b[11];
  b[11] = b[7];
  b[7] = b[3];
  b[3] = c;
};

void InvShiftRows(Block b)
{
  uint8_t c;

  c = b[13];
  b[13] = b[9];
  b[9] = b[5];
  b[5] = b[1];
  b[1] = c;

  c = b[14];
  b[14] = b[6];
  b[6] = c;

  c = b[10];
  b[10] = b[2];
  b[2] = c;

  c = b[15];
  b[15] = b[3];
  b[3] = b[7];
  b[7] = b[11];
  b[11] = c;
};

uint8_t _poly_multiple_02[0x100];
uint8_t _poly_multiple_03[0x100];
uint8_t _poly_multiple_09[0x100];
uint8_t _poly_multiple_0b[0x100];
uint8_t _poly_multiple_0d[0x100];
uint8_t _poly_multiple_0e[0x100];

void _init_poly_multiplication_table()
{
  _poly_multiple_02[0x00] = 0x00;
  _poly_multiple_03[0x00] = 0x00;
  _poly_multiple_09[0x00] = 0x00;
  _poly_multiple_0b[0x00] = 0x00;
  _poly_multiple_0d[0x00] = 0x00;
  _poly_multiple_0e[0x00] = 0x00;

  for (uint8_t i = 0xFF; i != 0; i--)
  {
    _poly_multiple_02[i] = poly_multiple(i, 0x02);
    _poly_multiple_03[i] = poly_multiple(i, 0x03);

    _poly_multiple_09[i] = poly_multiple(i, 0x09);
    _poly_multiple_0b[i] = poly_multiple(i, 0x0b);
    _poly_multiple_0d[i] = poly_multiple(i, 0x0d);
    _poly_multiple_0e[i] = poly_multiple(i, 0x0e);
  };
};

uint8_t _mix_column_0(uint8_t b0, uint8_t b1, uint8_t b2, uint8_t b3)
{
  return _poly_multiple_02[b0] ^
         _poly_multiple_03[b1] ^
         b2 ^
         b3;
};

uint8_t _mix_column_1(uint8_t b0, uint8_t b1, uint8_t b2, uint8_t b3)
{
  return b0 ^
         _poly_multiple_02[b1] ^
         _poly_multiple_03[b2] ^
         b3;
};

uint8_t _mix_column_2(uint8_t b0, uint8_t b1, uint8_t b2, uint8_t b3)
{
  return b0 ^ b1 ^
         _poly_multiple_02[b2] ^
         _poly_multiple_03[b3];
};

uint8_t _mix_column_3(uint8_t b0, uint8_t b1, uint8_t b2, uint8_t b3)
{
  return _poly_multiple_03[b0] ^
         b1 ^ b2 ^
         _poly_multiple_02[b3];
};

void MixColumns(Block b)
{
  uint8_t a0;
  uint8_t a1;
  uint8_t a2;
  uint8_t a3;
  for (uint8_t i = 0; i < 4; i++)
  {
    a0 = b[i * 4 + 0];
    a1 = b[i * 4 + 1];
    a2 = b[i * 4 + 2];
    a3 = b[i * 4 + 3];
    b[i * 4 + 0] = _mix_column_0(a0, a1, a2, a3);
    b[i * 4 + 1] = _mix_column_1(a0, a1, a2, a3);
    b[i * 4 + 2] = _mix_column_2(a0, a1, a2, a3);
    b[i * 4 + 3] = _mix_column_3(a0, a1, a2, a3);
  }
}

uint8_t _inv_mix_column_0(uint8_t b0, uint8_t b1, uint8_t b2, uint8_t b3)
{
  return _poly_multiple_0e[b0] ^
         _poly_multiple_0b[b1] ^
         _poly_multiple_0d[b2] ^
         _poly_multiple_09[b3];
};

uint8_t _inv_mix_column_1(uint8_t b0, uint8_t b1, uint8_t b2, uint8_t b3)
{
  return _poly_multiple_09[b0] ^
         _poly_multiple_0e[b1] ^
         _poly_multiple_0b[b2] ^
         _poly_multiple_0d[b3];
};

uint8_t _inv_mix_column_2(uint8_t b0, uint8_t b1, uint8_t b2, uint8_t b3)
{
  return _poly_multiple_0d[b0] ^
         _poly_multiple_09[b1] ^
         _poly_multiple_0e[b2] ^
         _poly_multiple_0b[b3];
};

uint8_t _inv_mix_column_3(uint8_t b0, uint8_t b1, uint8_t b2, uint8_t b3)
{
  return _poly_multiple_0b[b0] ^
         _poly_multiple_0d[b1] ^
         _poly_multiple_09[b2] ^
         _poly_multiple_0e[b3];
};

void InvMixColumns(Block b)
{
  uint8_t a0;
  uint8_t a1;
  uint8_t a2;
  uint8_t a3;
  for (uint8_t i = 0; i < 4; i++)
  {
    a0 = b[i * 4 + 0];
    a1 = b[i * 4 + 1];
    a2 = b[i * 4 + 2];
    a3 = b[i * 4 + 3];
    b[i * 4 + 0] = _inv_mix_column_0(a0, a1, a2, a3);
    b[i * 4 + 1] = _inv_mix_column_1(a0, a1, a2, a3);
    b[i * 4 + 2] = _inv_mix_column_2(a0, a1, a2, a3);
    b[i * 4 + 3] = _inv_mix_column_3(a0, a1, a2, a3);
  }
}

const uint8_t MAX_RCON = 10;

uint8_t _rcon[WORD_SIZE * MAX_RCON];
void _init_rcon()
{
  Poly xi = 0b1;
  for (uint8_t i = 0; i < 10; i++)
  {
    _rcon[i * WORD_SIZE + 0] = xi;
    _rcon[i * WORD_SIZE + 1] = 0;
    _rcon[i * WORD_SIZE + 2] = 0;
    _rcon[i * WORD_SIZE + 3] = 0;

    xi = poly_multiple(xi, 0b10);
  }
};

void init_tables()
{
  _init_sbox();
  _init_rcon();
  _init_poly_multiplication_table();
};

uint8_t *get_rcon_at(uint8_t i)
{
  return (&_rcon[0] + (i - 1) * WORD_SIZE);
};

const uint8_t AES_128_KEY_SIZE = (4 * WORD_SIZE);
const uint8_t AES_192_KEY_SIZE = (6 * WORD_SIZE);
const uint8_t AES_256_KEY_SIZE = (8 * WORD_SIZE);

const uint8_t _AES_128_ROUNDS_COUNT = 10;
const uint8_t _AES_192_ROUNDS_COUNT = 12;
const uint8_t _AES_256_ROUNDS_COUNT = 14;

uint8_t _get_rounds_count(uint8_t key_size)
{
  if (key_size == AES_128_KEY_SIZE)
  {
    return _AES_128_ROUNDS_COUNT;
  }
  else if (key_size == AES_192_KEY_SIZE)
  {
    return _AES_192_ROUNDS_COUNT;
  }
  else if (key_size == AES_256_KEY_SIZE)
  {
    return _AES_256_ROUNDS_COUNT;
  }

  return 0;
}

const uint8_t AES_128_EXPANDED_KEY_SIZE = WORD_SIZE * WORDS_IN_BLOCK * (_AES_128_ROUNDS_COUNT + 1);
const uint8_t AES_192_EXPANDED_KEY_SIZE = WORD_SIZE * WORDS_IN_BLOCK * (_AES_192_ROUNDS_COUNT + 1);
const uint8_t AES_256_EXPANDED_KEY_SIZE = WORD_SIZE * WORDS_IN_BLOCK * (_AES_256_ROUNDS_COUNT + 1);

// Maximum is 240 bytes
uint8_t get_size_of_key_expansion_buffer(uint8_t key_size)
{
  return WORD_SIZE * WORDS_IN_BLOCK * (_get_rounds_count(key_size) + 1);
};

void SubWord(Word w)
{
  for (uint8_t i = 0; i < 4; i++)
  {
    w[i] = _sbox[w[i]];
  };
};

void RotWord(Word w)
{
  uint8_t c;
  c = w[0];
  w[0] = w[1];
  w[1] = w[2];
  w[2] = w[3];
  w[3] = c;
};

void AddWords(Word a, Word b)
{
  a[0] = a[0] ^ b[0];
  a[1] = a[1] ^ b[1];
  a[2] = a[2] ^ b[2];
  a[3] = a[3] ^ b[3];
}

void fill_key_expansion(uint8_t *key, uint8_t key_size, uint8_t *buf)
{

  uint8_t key_size_in_words = key_size / WORD_SIZE;

  for (uint8_t i = 0; i < 4 * (_get_rounds_count(key_size) + 1); i++)
  {
    if (i < key_size_in_words)
    {
      for (uint8_t ii = 0; ii < WORD_SIZE; ii++)
      {
        buf[i * WORD_SIZE + ii] = key[i * WORD_SIZE + ii];
      };
    }
    else
    {
      for (uint8_t ii = 0; ii < WORD_SIZE; ii++)
      {
        buf[i * WORD_SIZE + ii] = buf[(i - 1) * WORD_SIZE + ii];
      }

      if (i % key_size_in_words == 0)
      {
        RotWord(buf + i * WORD_SIZE);
        SubWord(buf + i * WORD_SIZE);
        AddWords(buf + i * WORD_SIZE, get_rcon_at(i / key_size_in_words));
      };
      if (key_size_in_words == 8 && i % key_size_in_words == 4)
      {
        SubWord(buf + i * WORD_SIZE);
      };
      AddWords(buf + i * WORD_SIZE, buf + (i - key_size_in_words) * WORD_SIZE);
    }
  }
};

void AddRoundKey(Block b, uint8_t round, uint8_t *expanded_key)
{
  for (uint8_t i = 0; i < BLOCK_SIZE; i++)
  {
    b[i] = b[i] ^ expanded_key[round * BLOCK_SIZE + i];
  };
};

void aes_encrypt_block(Block b, uint8_t *expanded_key, uint8_t key_size)
{
  AddRoundKey(b, 0, expanded_key);
  uint8_t rounds_count = _get_rounds_count(key_size);
  for (uint8_t round = 1; round < rounds_count; round++)
  {
    SubBytes(b);
    ShiftRows(b);
    MixColumns(b);
    AddRoundKey(b, round, expanded_key);
  };
  SubBytes(b);
  ShiftRows(b);
  AddRoundKey(b, rounds_count, expanded_key);
};

void aes_decrypt_block(Block b, uint8_t *expanded_key, uint8_t key_size)
{
  uint8_t rounds_count = _get_rounds_count(key_size);
  AddRoundKey(b, rounds_count, expanded_key);
  InvShiftRows(b);
  InvSubBytes(b);
  for (uint8_t round = rounds_count - 1; round != 0; round--)
  {
    AddRoundKey(b, round, expanded_key);
    InvMixColumns(b);
    InvShiftRows(b);
    InvSubBytes(b);
  }
  AddRoundKey(b, 0, expanded_key);
};
