import { Token } from "./scanner.func";
import { Scanner } from "./scanner";

const DEMO_TOKENS = "abcdefghijklmno";
const DEMO_TOKEN_STREAM: ReadonlyArray<Token> = DEMO_TOKENS.split("").map(
  (identifier, idx) => ({
    type: "identifier",
    length: 1,
    pos: 1 + idx,
    line: 1,
    text: identifier,
  })
);

const createDemoReader = () => {
  const myStream = [...DEMO_TOKEN_STREAM];
  function scan(): Token {
    const token = myStream.shift();
    if (token) {
      return token;
    } else {
      return {
        type: "end",
        length: 0,
        pos: DEMO_TOKENS.length + 1,
        line: 1,
      };
    }
  }
  return scan;
};

describe("Scanner", () => {
  it(`Scans`, () => {
    const scanner = new Scanner(createDemoReader());

    DEMO_TOKENS.split("").forEach((t, idx) => {
      expect(scanner.current().pos).toBe(idx + 1);
      expect(scanner.current().type).toBe("identifier");
      scanner.readNext();
    });
    expect(scanner.current().type).toBe("end");
  });
  it(`Scans with one control point`, () => {
    const scanner = new Scanner(createDemoReader());
    expect(scanner.current().pos).toBe(1);

    scanner.makeControlPoint();
    scanner.clearControlPoint();

    expect(() => scanner.clearControlPoint()).toThrow();

    expect(scanner.current().pos).toBe(1);

    scanner.makeControlPoint();
    scanner.readNext();
    expect(scanner.current().pos).toBe(2);
    scanner.clearControlPoint();
    expect(scanner.current().pos).toBe(2);
    scanner.readNext();
    expect(scanner.current().pos).toBe(3);

    scanner.makeControlPoint();
    expect(scanner.current().pos).toBe(3);
    scanner.readNext();
    expect(scanner.current().pos).toBe(4);
    scanner.rollbackControlPoint();
    expect(scanner.current().pos).toBe(3);
    scanner.readNext();
    expect(scanner.current().pos).toBe(4);

    scanner.readNext();
    expect(scanner.current().pos).toBe(5);

    scanner.makeControlPoint();
    expect(scanner.current().pos).toBe(5);
    scanner.readNext();
    expect(scanner.current().pos).toBe(6);
    scanner.readNext();
    expect(scanner.current().pos).toBe(7);
    scanner.readNext();
    expect(scanner.current().pos).toBe(8);
    scanner.rollbackControlPoint();
    expect(scanner.current().pos).toBe(5);
    scanner.readNext();
    expect(scanner.current().pos).toBe(6);
    scanner.readNext();
    expect(scanner.current().pos).toBe(7);
    scanner.readNext();
    expect(scanner.current().pos).toBe(8);
    scanner.readNext();
    expect(scanner.current().pos).toBe(9);
    scanner.readNext();
    expect(scanner.current().pos).toBe(10);
  });

  it(`Scans with two empty control points `, () => {
    const scanner = new Scanner(createDemoReader());

    scanner.makeControlPoint();
    scanner.makeControlPoint();

    scanner.clearControlPoint();
    scanner.clearControlPoint();
    expect(scanner.current().pos).toBe(1);

    scanner.makeControlPoint();
    scanner.makeControlPoint();

    scanner.rollbackControlPoint();
    scanner.rollbackControlPoint();
    expect(scanner.current().pos).toBe(1);
  });
  it(`Scans with two control points, each rolledback`, () => {
    const scanner = new Scanner(createDemoReader());

    scanner.readNext();
    expect(scanner.current().pos).toBe(2);
    scanner.makeControlPoint();
    scanner.readNext();
    expect(scanner.current().pos).toBe(3);
    scanner.makeControlPoint();
    scanner.readNext();
    expect(scanner.current().pos).toBe(4);

    scanner.rollbackControlPoint();
    expect(scanner.current().pos).toBe(3);
    scanner.readNext();
    expect(scanner.current().pos).toBe(4);
    scanner.readNext();
    expect(scanner.current().pos).toBe(5);

    scanner.rollbackControlPoint();
    expect(scanner.current().pos).toBe(2);
    scanner.readNext();
    expect(scanner.current().pos).toBe(3);
    scanner.readNext();
    expect(scanner.current().pos).toBe(4);
    scanner.readNext();
    expect(scanner.current().pos).toBe(5);
  });

  it(`Scans with two control points, each rolledback 2`, () => {
    const scanner = new Scanner(createDemoReader());

    scanner.readNext();
    expect(scanner.current().pos).toBe(2);

    scanner.makeControlPoint();
    scanner.readNext();
    expect(scanner.current().pos).toBe(3);
    scanner.readNext();
    expect(scanner.current().pos).toBe(4);
    scanner.readNext();
    expect(scanner.current().pos).toBe(5);
    scanner.rollbackControlPoint();

    scanner.makeControlPoint();
    expect(scanner.current().pos).toBe(2);
    scanner.readNext();
    expect(scanner.current().pos).toBe(3);
    scanner.rollbackControlPoint();

    expect(scanner.current().pos).toBe(2);
    scanner.readNext();
    expect(scanner.current().pos).toBe(3);
    scanner.readNext();
    expect(scanner.current().pos).toBe(4);
    scanner.readNext();
    expect(scanner.current().pos).toBe(5);
  });

  it(`Scans with two control points, first cleared, second rolledback`, () => {
    const scanner = new Scanner(createDemoReader());
    scanner.readNext();

    scanner.makeControlPoint();
    scanner.readNext();
    scanner.readNext();
    expect(scanner.current().pos).toBe(4);

    scanner.makeControlPoint();
    scanner.readNext();
    scanner.rollbackControlPoint();
    expect(scanner.current().pos).toBe(4);

    scanner.readNext();
    expect(scanner.current().pos).toBe(5);

    scanner.clearControlPoint();
    expect(scanner.current().pos).toBe(5);
  });

  it(`Scans with two control points, first rolled back, second cleared`, () => {
    const scanner = new Scanner(createDemoReader());
    scanner.readNext();

    scanner.makeControlPoint();
    scanner.readNext();
    scanner.readNext();
    expect(scanner.current().pos).toBe(4);

    scanner.makeControlPoint();
    scanner.readNext();
    scanner.clearControlPoint();
    expect(scanner.current().pos).toBe(5);

    scanner.readNext();
    expect(scanner.current().pos).toBe(6);

    scanner.rollbackControlPoint();
    expect(scanner.current().pos).toBe(2);
    scanner.readNext();
    expect(scanner.current().pos).toBe(3);
    scanner.readNext();
    expect(scanner.current().pos).toBe(4);
    scanner.readNext();
    expect(scanner.current().pos).toBe(5);
    scanner.readNext();
    expect(scanner.current().pos).toBe(6);
    scanner.readNext();
    expect(scanner.current().pos).toBe(7);
  });
});
