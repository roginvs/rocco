import {
  TranslationUnit,
  FunctionDefinition,
  DeclaratorNode,
} from "../core/parser.definitions";

export function writeAst(unit: TranslationUnit, write: (msg: string) => void) {
  const [header, lines] = writeNode(unit);
  write(header);
  lines.forEach((l) => write(l));
}

function writeNode(node: any): [string, string[]] {
  if (node === null || node === undefined) {
    return ["", []];
  }

  const lines: string[] = [];

  if (Array.isArray(node)) {
    let customLine = "";
    node.forEach((n) => {
      if (typeof n === "string") {
        customLine += `  ${n}`;
      } else {
        const arrNode = writeNode(n);
        lines.push(`  - ${arrNode[0]}`);
        lines.push(...arrNode[1].map((l) => `    ${l}`));
      }
    });
    if (customLine) {
      lines.push(customLine);
    }

    return ["", lines];
  }

  if (!node.type) {
    return ["", []];
  }
  let header = `${node.type}`;
  header = header.slice(0, 1).toUpperCase() + header.slice(1);
  header = header.replace(/ /g, "_").replace(/-/g, "_");

  const keys = Object.keys(node).filter((x) => x !== "type");

  keys.forEach((k) => {
    const v = node[k];
    const t = typeof v;

    if (v === null || t === "undefined") {
      // nothing here
    } else if (t === "string" || t === "number" || t === "boolean") {
      // Or, maybe, to add "" if value have symbols other than a-z0-9 ?
      if (k !== "operator") {
        header += ` ${k}=${v}`;
      } else {
        header += ` ${k}="${v}"`;
      }
    } else if (t === "object") {
      lines.push(`  ${k}:`);
      const [childHeader, childText] = writeNode(v);
      if (childHeader) {
        lines.push(`    ${childHeader}`);
        lines.push(...childText.map((l) => `    ${l}`));
      } else {
        lines.push(...childText.map((l) => `  ${l}`));
      }
    }
  });

  return [header, lines];
}
