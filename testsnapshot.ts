import * as fs from "fs";

export function testSnapshot(id: string, testname: string, node: object) {
  const fname =
    __dirname +
    "/testsnapshots/" +
    id +
    " - " +
    testname.replace(/\n/g, "").replace(/[\(\)\{\}\*\,/]/g, "") +
    ".json";
  if (fs.existsSync(fname)) {
    const data = JSON.parse(
      fs.readFileSync(fname).toString().split("\n").slice(1).join("\n")
    );
    expect(node).toMatchObject(data);
  } else {
    fs.writeFileSync(
      fname,
      "// " +
        (new Error().stack as string)
          .split("\n")
          .slice(1)
          .map((x) => x.trim())
          .join(" ") +
        "\n" +
        JSON.stringify(node, null, 4)
    );
  }
}
