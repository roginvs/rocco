import { dataString } from "./emitter.utils";

describe("Emitter utils", () => {
  const testCase = {
    0: "\\00\\00\\00\\00",
    [0x8f + 0x9f * 256]: "\\8f\\9f\\00\\00",
    [1 + 0x8f * 256 * 256 + 0x9f * 256 * 256 * 256]: "\\01\\00\\8f\\9f",
    [0xffffffff]: "\\ff\\ff\\ff\\ff",
  } as const;
  for (const k of Object.entries(testCase)) {
    it(`dataString 4 bytes ${k}`, () =>
      expect(dataString.int4(parseInt(k[0]))).toBe(k[1]));
  }
});
