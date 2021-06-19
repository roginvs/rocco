import * as React from "react";
import { readFileSync } from "fs";
import { Editor } from "./editor";
import styled, { CSSObject } from "styled-components";

import { useIsMobile, useWindowSize } from "./hooks";
const aesCode = readFileSync(__dirname + "/../test/emitter.aes.c").toString();
const crc32Code = readFileSync(
  __dirname + "/../test/emitter.crc32.c"
).toString();
const simpleExampleCode1 = readFileSync(
  __dirname + "/simple_example_1.c"
).toString();
const simpleExampleCode2 = readFileSync(
  __dirname + "/simple_example_2.c"
).toString();
const simpleExampleCode3 = readFileSync(
  __dirname + "/simple_example_3.c"
).toString();
const simpleExampleCode4 = readFileSync(
  __dirname + "/simple_example_4.c"
).toString();

const INITIAL_CODE = simpleExampleCode1;

console.info(aesCode.length);

const RootContainer: React.FC<{}> = (props) => {
  const isMobile = useIsMobile();
  const windowSize = useWindowSize();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        height: isMobile ? undefined : windowSize.height - 1,
        overflow: "hidden",
        padding: 5,
      }}
    >
      {props.children}
    </div>
  );
};

const EditorContainer = styled("div")({
  width: "100%",
  height: "100%",
});

const ControlsContainer: React.FC = (props) => {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        flexGrow: 0,
        display: "flex",
        flexDirection: "column",
        fontFamily: "monospace",
        alignItems: "stretch",
        marginLeft: isMobile ? undefined : 8,
      }}
    >
      {props.children}
    </div>
  );
};

const Button = styled("button")({
  marginTop: 4,
  fontFamily: "monospace",
});
const CompileButton = styled(Button)({
  marginBottom: "auto",
  paddingTop: 30,
  paddingBottom: 30,
});

const smallInfoStyles: CSSObject = {
  color: "gray",
  fontSize: "smaller",
  textAlign: "center",
  marginBottom: 5,
  marginTop: 5,
};
const SmallInfo = styled("span")(smallInfoStyles);
const TestCoverage = styled("a")({
  ...smallInfoStyles,
  textDecoration: "underline",
});

function MainCss() {
  const style = `
  body,html {
    margin: 0;
    padding: 0;
}
* {
    box-sizing: border-box;
}`;
  React.useEffect(() => {
    const tag = document.createElement("style");
    document.body.appendChild(tag);
    tag.appendChild(document.createTextNode(style));
    return () => {
      document.body.removeChild(tag);
    };
  });
  return null;
}

export function App() {
  const [code, setCode] = React.useState(INITIAL_CODE);

  return (
    <RootContainer>
      <MainCss />
      <EditorContainer>
        <Editor value={code} onChange={(newCode) => setCode(newCode)} />
      </EditorContainer>
      <ControlsContainer>
        <CompileButton>Compile!</CompileButton>
        <SmallInfo>
          Built at{" "}
          {new Date(
            parseInt(process.env.BUILD_TIME || "") * 1000
          ).toLocaleString()}
        </SmallInfo>
        <TestCoverage href="coverage/lcov-report/core/index.html">
          Test coverage
        </TestCoverage>
        <Button onClick={() => setCode(simpleExampleCode1)}>
          Load simple example 1
        </Button>
        <Button onClick={() => setCode(simpleExampleCode2)}>
          Load simple example 2
        </Button>
        <Button onClick={() => setCode(simpleExampleCode3)}>
          Load simple example 3
        </Button>
        <Button onClick={() => setCode(simpleExampleCode4)}>
          Load simple example 4
        </Button>
        <Button onClick={() => setCode(aesCode)}>Load aes example</Button>
        <Button onClick={() => setCode(crc32Code)}>Load crc32 example</Button>
      </ControlsContainer>
    </RootContainer>
  );
}
