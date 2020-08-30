import { TypeParserDependencies } from "./parser.typename";
import { Scanner } from "./scanner";
import { ExpressionNode } from "./parser.definitions";
export const createMockedExpressionParser = (scanner: Scanner) => {
  const mock: TypeParserDependencies = {
    readAssignmentExpression() {
      const nextToken = scanner.current();
      let node: ExpressionNode;
      if (nextToken.type === "const-expression") {
        node = {
          type: "const",
          subtype: "int",
          value: nextToken.value,
        };
      } else if (nextToken.type === "*") {
        scanner.readNext();
        const identifierToken = scanner.current();
        if (identifierToken.type !== "identifier") {
          throw new Error("Mocked expession parser expects identifier");
        }
        node = {
          type: "unary-operator",
          operator: "*",
          target: {
            type: "identifier",
            value: "p",
            declaratorNode: () => {
              throw new Error("Not implemented in tests");
            },
          },
        };
      } else {
        throw new Error("Not implemented in mocked expression parser");
      }
      scanner.readNext();

      return node;
    },
  };
  return mock;
};
