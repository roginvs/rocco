import child_process from "child_process";
import fs from "fs";
describe("Testing cli", () => {
  // Better to use mktmp or something similar
  const tmpFileName = ".cache/testrun";
  if (!fs.existsSync(".cache")) {
    fs.mkdirSync(".cache");
  }

  it(`Compiles test file`, () => {
    if (fs.existsSync(tmpFileName)) {
      fs.unlinkSync(tmpFileName);
    }
    const result = child_process
      .execSync(`./rocco test/emitter.crc32.c ${tmpFileName}`)
      .toString();

    expect(result.indexOf("Done") > -1).toBe(true);

    const fData = fs.readFileSync(tmpFileName).toString();
    expect(fData.length > 1000).toBe(true);
    fs.unlinkSync(tmpFileName);
  });
});
