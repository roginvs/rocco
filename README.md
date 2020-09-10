# Rocco

Rogin C Compiler

## What is this

A compiler from subset of C language into webassembly

## What is supported

TODO to add

## What is not supported yet

- proper type checking
- "long long", float, double, short types
- switch and goto statements
- unions and structs
- dynamic arrays

## Why no goto/switch

https://en.wikipedia.org/wiki/Structured_program_theorem
https://github.com/kripken/emscripten/raw/master/docs/paper.pdf
https://medium.com/leaningtech/solving-the-structured-control-flow-problem-once-and-for-all-5123117b1ee2

## Links

https://www.w3.org/TR/wasm-core-1/
https://webassembly.github.io/spec/core/appendix/index-instructions.html
C99 specification
https://developer.mozilla.org/ru/docs/WebAssembly/Understanding_the_text_format
