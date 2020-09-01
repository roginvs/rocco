export type DeclaratorId = string & { readonly _nominal: "declarator id " };
import pad from "pad";

let currentGlobalId = 1;

export function createDeclaratorId() {
  let id = pad(4, `${currentGlobalId}`, "0");
  currentGlobalId++;
  return id as DeclaratorId;
}
