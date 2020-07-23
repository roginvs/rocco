(module
;; asdasd
(; comment ;)
  (memory 127)
  ;;(import "js" "mem" (memory 1))

  (func (param $kek i32)(local $l i32)
   nop
   nop
   ;;(i32.const 50)
   ;;(i32.load 0)
   ;;(unreachable)
  )


  (func $savingadd2 (param $how_many_to_add i32)(result i32)
    nop
    local.get $how_many_to_add
    call $savingadd
  )

  (func $savingadd (param $how_many_to_add i32)(result i32)
    nop


    ;; at pos 0x22

    i32.const 0x22


    i32.const 0x22
    i32.load
    nop
    local.get $how_many_to_add
    nop
      
    i32.add

    i32.store

    i32.const 0x22
    i32.load
  )

  
  (func $ifelse (param $val i32)(result i32)
  nop
  nop 
  nop


  
    (if (result i32) (local.get 0)
        (then (i32.const 77))
        (else (i32.const 78)) )


  )
 
  (func $init  
    nop
      i32.const 0x22
      i32.const 10
      i32.store
    nop
  )

  (start $init)

   (export "savingadd" (func $savingadd2))
)