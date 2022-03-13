import { compile } from "./funcs";

describe(`Emits and compiles`, () => {
  it(`Func2 returns 41`, async () => {
    const d = await compile<{
      return_const(): number;
      void_func(): void;
      counter(): number;
    }>("emitter1.c");

    const initialEsp = d.compiled._debug_get_esp();

    d.compiled.void_func();
    expect(d.compiled._debug_get_esp()).toBe(initialEsp);
    expect(d.compiled.return_const()).toBe(41);

    expect(d.compiled._debug_get_esp()).toBe(initialEsp);

    expect(d.compiled.counter()).toBe(1);
    expect(d.compiled._debug_get_esp()).toBe(initialEsp);
    expect(d.compiled.counter()).toBe(2);
    expect(d.compiled.counter()).toBe(3);
    expect(d.compiled.counter()).toBe(4);
  });
});

/*
TODO:
- https://mbebenita.github.io/WasmExplorer/ 

- (data ... )  for initialization


*/
