```C
int kek1() {
  return 22;
}
int kek2() {
  return 232;
}
struct kek {
  int i;
  int j;
};
struct kek get_kek(float n, double j) {
  struct kek kek2;
  return kek2;
}

int lol(int x) {
  int (*p)()= x > 0 ? &kek1 : &kek2;

  int (*p2)(int i, long long int j) = p;
  (*p2)(5555, 6666);

  struct kek (*p3)() = &get_kek;
  return 33;
}

```

```wat

(module
 (type $FUNCSIG$iij (func (param i32 i64) (result i32)))
 (type $FUNCSIG$v (func))
 (type $FUNCSIG$i (func (result i32)))
 (type $FUNCSIG$vifd (func (param i32 f32 f64)))
 (table 4 4 anyfunc) ;; 4=4=min=max
 (elem (i32.const 0) $__wasm_nullptr $kek1 $kek2 $get_kek)
 (memory $0 1)
 (export "memory" (memory $0))
 (export "kek1" (func $kek1))
 (export "kek2" (func $kek2))
 (export "get_kek" (func $get_kek))
 (export "lol" (func $lol))
 (func $kek1 (; 0 ;) (type $FUNCSIG$i) (result i32)
  (i32.const 22)
 )
 (func $kek2 (; 1 ;) (type $FUNCSIG$i) (result i32)
  (i32.const 232)
 )
 (func $get_kek (; 2 ;) (type $FUNCSIG$vifd) (param $0 i32) (param $1 f32) (param $2 f64)
  (local $3 i32)
  (i32.store
   (i32.add
    (get_local $0)
    (i32.const 4)
   )
   (i32.load offset=12
    (tee_local $3
     (i32.sub
      (i32.load offset=4
       (i32.const 0)
      )
      (i32.const 32)
     )
    )
   )
  )
  (f32.store offset=28
   (get_local $3)
   (get_local $1)
  )
  (f64.store offset=16
   (get_local $3)
   (get_local $2)
  )
  (i32.store
   (get_local $0)
   (i32.load offset=8
    (get_local $3)
   )
  )
 )
 (func $lol (; 3 ;) (param $0 i32) (result i32)
  (local $1 i32)
  (i32.store offset=4
   (i32.const 0)
   (tee_local $1
    (i32.sub
     (i32.load offset=4
      (i32.const 0)
     )
     (i32.const 16)
    )
   )
  )
  (i32.store offset=12
   (get_local $1)
   (get_local $0)
  )
  (i32.store offset=8
   (get_local $1)
   (tee_local $0
    (select
     (i32.const 1)
     (i32.const 2)
     (i32.gt_s
      (get_local $0)
      (i32.const 0)
     )
    )
   )
  )
  (i32.store offset=4
   (get_local $1)
   (get_local $0)
  )
  (drop
   (call_indirect (type $FUNCSIG$iij)
    (i32.const 5555)
    (i64.const 6666)
    (get_local $0)
   )
  )
  (i32.store
   (get_local $1)
   (i32.const 3)
  )
  (i32.store offset=4
   (i32.const 0)
   (i32.add
    (get_local $1)
    (i32.const 16)
   )
  )
  (i32.const 33)
 )
 (func $__wasm_nullptr (; 4 ;) (type $FUNCSIG$v)
  (unreachable)
 )
)


```
