(;

int test_char_arithmetic()
{
  unsigned char c1 = 250;
  unsigned char c2 = 100;
  unsigned char c3 = c1 + c2;
  int i = c1 + c2;
  return i;
}


;)

(module
 (table 0 anyfunc)
 (memory $0 1)
 (export "memory" (memory $0))
 (export "test_char_arithmetic" (func $test_char_arithmetic))
 (func $test_char_arithmetic (; 0 ;) (result i32)
  (local $0 i32)
  (local $1 i32)
  (i32.store8 offset=15
   (tee_local $1
    (i32.sub
     (i32.load offset=4
      (i32.const 0)
     )
     (i32.const 16)
    )
   )
   (i32.const 250)
  )
  (i32.store8 offset=14
   (get_local $1)
   (i32.const 100)
  )
  (i32.store8 offset=13
   (get_local $1)
   (i32.add
    (i32.load8_u offset=15
     (get_local $1)
    )
    (i32.load8_u offset=14
     (get_local $1)
    )
   )
  )
  (i32.store offset=8
   (get_local $1)
   (tee_local $0
    (i32.add
     (i32.load8_u offset=15
      (get_local $1)
     )
     (i32.load8_u offset=14
      (get_local $1)
     )
    )
   )
  )
  (get_local $0)
 )
)
