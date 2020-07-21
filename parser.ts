import { Scanner } from "./scanner";

type ExpressionNode =
  | {
      type: "identifier";
      value: string;
    }
  | {
      type: "const";
      subtype: "int" | "float" | "char";
      value: number;
    }
  | {
      type: "string-literal";
      value: string;
    };

function parse(scanner: Scanner) {
  function parseError(info: string): never {
    throw new Error(
      `${info} at line=${scanner.current().line} pos=${scanner.current().pos}`
    );
  }

  function readPrimaryExpression(): ExpressionNode | undefined {
    const token = scanner.current();
    if (token.type === "identifier") {
      scanner.readNext();
      return {
        type: "identifier",
        value: token.text,
      };
    } else if (token.type === "const") {
      return {
        type: "const",
        subtype: token.subtype,
        value: token.value,
      };
    } else if (token.type === "string-literal") {
      scanner.readNext();
      return {
        type: "string-literal",
        value: token.value,
      };
    } else if (token.type === "punc" && token.value === "(") {
      scanner.readNext();
      const expression = readExpression();
      scanner.readNext();
      const closing = scanner.current();
      if (closing.type !== "punc" || closing.value !== ")") {
        parseError("Expecting closing brace");
      }
      scanner.readNext();
      return expression;
    }
  }

  function readExpression() {
    // @todo
    return undefined;
  }
}
