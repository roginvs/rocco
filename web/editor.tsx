import * as React from "react";

import MonacoEditor from "@monaco-editor/react";
import { loader } from "@monaco-editor/react";
import { useIsMobile } from "./useIsMobile";
loader.config({ paths: { vs: "./monaco" } });

export function Editor({
  value,
  onChange,
}: {
  value: string;
  onChange: (newValue: string) => void;
}) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <textarea
        style={{ width: "100%", height: "100%" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else {
    return (
      <MonacoEditor
        height="100%"
        width="100%"
        language="c"
        theme="vs-dark"
        value={value}
        onChange={(e) => {
          onChange(e || "");
        }}
      />
    );
  }
}
