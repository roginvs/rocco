import * as fs from "fs";

export function testSnapshot(id: string, testname: string, node: object) {
  const fname =
    __dirname +
    "/testsnapshots/" +
    id +
    " - " +
    testname
      .replace(/\n|\r/g, "")
      .replace(/[\(\)\{\}\*\,\;\:\+\?/]/g, "")
      .replace(/ +/g, " ") +
    ".json";
  if (fs.existsSync(fname)) {
    const data = JSON.parse(
      fs
        .readFileSync(fname)
        .toString()
        .split("\n")
        .filter((x) => x)
        .filter((x) => !x.startsWith("//"))
        .join("\n")
    );
    expect(node).toMatchObject(data);
  } else {
    fs.writeFileSync(
      fname,
      "// " +
        (new Error().stack as string)
          .split("\n")
          .slice(1)
          .map((x) => `//${x}\n`)
          .join("") +
        "\n" +
        JSON.stringify(node, null, 2)
    );
  }
}
