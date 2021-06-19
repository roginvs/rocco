import * as React from "react";
import { readFileSync } from "fs";

import Editor from "@monaco-editor/react";
import { loader } from "@monaco-editor/react";
loader.config({ paths: { vs: "./monaco" } });

const aesCode = readFileSync(__dirname + "/../test/emitter.aes.c").toString();

console.info(aesCode.length);
export function App() {
  return (
    <div>
      TODO
      <Editor
        // height="90vh"
        language="c"
        theme="vs-dark"
        value={aesCode}
        onChange={(e) => {
          // console.info(e);
        }}
      />
    </div>
  );
}
