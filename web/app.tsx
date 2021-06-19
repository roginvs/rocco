import * as React from "react";
import { readFileSync } from "fs";
import { Editor } from "./editor";
import styled, { CSSObject } from "styled-components";
import { useIsMobile } from "./useIsMobile";
const aesCode = readFileSync(__dirname + "/../test/emitter.aes.c").toString();
const crc32Code = readFileSync(
  __dirname + "/../test/emitter.crc32.c"
).toString();
const simpleExampleCode = readFileSync(
  __dirname + "/simple_example.c"
).toString();

const INITIAL_CODE = simpleExampleCode;

console.info(aesCode.length);

const RootContainer: React.FC<{}> = (props) => {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        height: isMobile ? undefined : "100%",
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

export function App() {
  const [code, setCode] = React.useState(INITIAL_CODE);

  return (
    <RootContainer>
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
        <Button>Load simple example</Button>
        <Button>Load aes example</Button>
        <Button>Load crc32 example</Button>
      </ControlsContainer>
    </RootContainer>
  );
}
