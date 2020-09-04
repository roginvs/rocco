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

    drop
    i32.const 89
  )

  (func $test_stack_values (export "test_stack_values") (result i32)
    ;; i32.const 3
    ;; i64.extend_i32_u
    i64.const 2 ;; 
    i32.wrap_i64 ;; Return type must be i32
    ;; Just testing extend/wrap
    i64.extend_i32_u
    i32.wrap_i64
  )

  (func $blocks_and_ifs (export "blocks_and_ifs")  (param $x i32) (result i32) (local $value_to_return i32)
    i32.const  0 ;; A default value
    local.set $value_to_return

    (block $label0
       (block $label1
        

          local.get $x
          i32.const 10
          i32.lt_s ;; If x < 10

          if $what_is_this_label_for ;; (result i32)     ;; no result
           ;; i32.const 79
             i32.const 100
             local.set $value_to_return
             br $label0
          else 
            nop
          end
          ;; br_if $label0            
        
      )
      local.get $value_to_return
      i32.const 1
      i32.add
      local.set $value_to_return
    )

    local.get $value_to_return

  )
  
  (func $blocks_and_ifs2 (export "blocks_and_ifs2")  (param $x i32) (result i32) (local $value_to_return i32)
    ;;
    ;;  http://mbebenita.github.io/WasmExplorer/ shows that clang is making
    ;;  blocks for ifs too. Blocks are like "goto_forward"
    ;;
    ;;
    ;;     

    local.get $x
  )
 
  

  (export "savingadd" (func $savingadd2))
)