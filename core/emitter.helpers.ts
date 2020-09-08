import {
  DeclaratorId,
  DeclaratorNode,
  NodeLocator,
  DeclaratorMap,
  Node,
} from "./parser.definitions";
import { CheckerError } from "./error";
import { CheckerWarning } from "./emitter.definitions";
import { FunctionSignatures } from "./emitter.helpers.functionsignature";

export interface EmitterHelpers {
  error(node: Node, msg: string): never;
  warn(node: Node, msg: string): void;
  cloneLocation(fromNode: Node, toNode: Node): void;
  getDeclaration(declaratorId: DeclaratorId): DeclaratorNode;
  warnings: CheckerWarning[];
  functionSignatures: FunctionSignatures;
}

export function createHelpers(
  locator: NodeLocator,
  declaratorMap: DeclaratorMap
): EmitterHelpers {
  const warnings: CheckerWarning[] = [];

  function getDeclaration(declaratorId: DeclaratorId) {
    const declaration = declaratorMap.get(declaratorId);
    if (!declaration) {
      throw new Error(
        `Internal error: unable to find declaration ${declaratorId}`
      );
    }
    return declaration;
  }

  function cloneLocation(fromNode: Node, toNode: Node) {
    const location = locator.get(fromNode);
    if (!location) {
      console.warn(`No location for node`, fromNode);
      return;
    }
    locator.set(toNode, location);
  }

  function warn(node: Node, msg: string) {
    const location = locator.get(node);
    if (!location) {
      console.warn(`Unable to find location for node type=${node.type}`);
      warnings.push({
        msg,
        length: 0,
        pos: 0,
        line: 0,
      });
    } else {
      warnings.push({
        msg,
        ...location,
      });
    }
  }
  function error(node: Node, msg: string): never {
    // TODO: Add error into errors list
    // Now we just throw
    const location = locator.get(node);
    if (!location) {
      console.warn(`Unable to find location for node type=${node.type}`);
      throw new CheckerError(`${msg}`, { pos: 0, line: 0, length: 0 });
    } else {
      throw new CheckerError(`${msg}`, location);
    }
  }

  const functionSignatures = new FunctionSignatures();

  return {
    error,
    warn,
    cloneLocation,
    getDeclaration,
    warnings,
    functionSignatures,
  };
}
