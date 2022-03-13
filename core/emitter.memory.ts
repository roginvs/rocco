/*

Memory structure:

0x0 - 0x4 : 4 bytes, reserved
..........: stack (starts from the top and grows downwards)
..........: 4 bytes, ESP_ADDRESS
..........: 4 bytes, HEAP_BEGIN_ADDRESS
..........: globals
..........: <maybe something reserved>
..........: heap starts here


Function call frame:
$ebp = ESP - <function locals size>
ESP = ESP - <function locals size>

All locals are references as "$ebp + address", not minus!

In is possible to not to use $ebp and to directly use ESP, 
  but for this the function show have no VLAs.

ESP might be subtracted more, for example for VLAs.

 */
export const STACK_SIZE = 0x10000;
export const ESP_ADDRESS = 4 + STACK_SIZE;
/**
 * It happened that top of the stack is right before global of ESP
 */
export const ESP_INITIAL_VALUE = ESP_ADDRESS;
export const HEAP_BEGIN_ADDRESS = ESP_ADDRESS + 4;
export const GLOBALS_BEGIN_ADDRESS = HEAP_BEGIN_ADDRESS + 4;
