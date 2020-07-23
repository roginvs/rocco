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


 

  (func $add (param $how_many_to_add i32)(result i32)
    nop


    ;; at pos 4

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
 
)