import * as fs from "fs";

export function testSnapshot(
  id: string,
  testname: string,
  node: object,
  comments: string = ""
) {
  const fname =
    __dirname +
    "/../snapshots/" +
    id +
    "_" +
    testname
      .replace(/\n|\r/g, "")
      .replace(/[\(\)\{\}\*\,\;\:\+\?\<\>/]/g, "")
      .replace(/ +/g, "_") +
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
      `// ${id.replace(/\n/g, "")}\n` +
        testname
          .split("\n")
          .map((l) => `// ${l}\n`)
          .join("") +
        "//\n" +
        comments
          .split("\n")
          .map((l) => `// ${l}\n`)
          .join("") +
        "//\n" +
        /*
        (new Error().stack as string)
          .split("\n")
          .slice(1)
          .map((x) => `//${x}\n`)
          .join("") +
          */
        "\n" +
        JSON.stringify(node, null, 2)
    );
  }
}
