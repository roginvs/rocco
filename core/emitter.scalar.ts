import { Typename } from "./parser.definitions";

/**
 * Returns true if typename is scalar = arithmetic||pointer
 */
export function isScalar(typename: Typename) {
  return typename.type === "arithmetic" || typename.type === "pointer";
}
