import { readFileSync } from "fs";

const aesCode = readFileSync(__dirname + "/../test/emitter.aes.c").toString();
const crc32Code = readFileSync(
  __dirname + "/../test/emitter.crc32.c"
).toString();
// wow
