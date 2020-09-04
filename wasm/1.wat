(module
;; asdasd
(; comment ;)
  ;; (global $g (import "js" "global") (mut i32))

  (memory 127)

  

  ;;(import "js" "mem" (memory 1))

  (func (param $kek i32)(local $l i32)
   nop
   nop
   ;;(i32.const 50)
   ;;(i32.load 0)
   ;;(unreachable)
  )


  (func $savingadd2 (param $how_many_to_add i32)(result i32)(local i32)
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

  
  (func $ifelse (param $val i32)  
    (if (result i32) (local.get 0)
        (then (i32.const 77))
        (else (i32.const 78)) )
    drop

    

    i32.const 1
    if $kek (result i32)     
      i32.const 79
    else 
      i32.const 80
    end
    drop

  )


  (func $loop1 (export "loop1") (result i32)
    i32.const 0
    ;; Returns fine
    (loop $loop1
      nop      
      nop
    )
  )
  (func $loop2 (export "loop2") (result i32)
    ;; Loops forever
    (loop $loop1
      nop
      br $loop1
    )
    i32.const 222
  )

  (func $block 
  
    block $kek (result i32)
      nop
      i32.const 0x40
    end
    
    drop
    nop
    nop

    (block (result i32) nop i32.const 0x41)
    drop
    nop
    nop 
  )
 
  (func $init  
    nop
      i32.const 0x22
      i32.const 10
      i32.store
    nop
  )

  (start $init)

  (func $test_nested_br (export "test_nested_br") (result i32)
    (block (result i32)
      (block (result i32)
        (block (result i32) ;; Every block must have return type
        i32.const 88
        br 2
        )
      )
    )
  )

  (export "savingadd" (func $savingadd2))
)