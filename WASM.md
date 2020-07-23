## Install

```sh
git clone --recursive https://github.com/WebAssembly/wabt && \
cd wabt && \
mkdir build && \
cd build && \
cmake .. && \
cmake --build . && \

```

## Notes

```

../wabt/bin/wat2wasm 1.wat
../wabt/bin/wat2wasm 1.wat -v
```

https://developer.mozilla.org/ru/docs/WebAssembly/Understanding_the_text_format
https://rsms.me/wasm-intro#addressing-memory
