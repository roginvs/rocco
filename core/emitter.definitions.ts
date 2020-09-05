import { Typename } from "./parser.definitions";
import { TokenLocation } from "./error";

export type WAInstuction = string;

export type RegisterType = "i32" | "i64" | "f32" | "f64";

export type WAInstuctionWhenMemoryIsReady = () => WAInstuction[];
export interface ExpressionInfo {
  type: Typename;

  /**
   * Value is available only for arithmetic types and pointers
   * I.e. "scalar types"
   * It is like "get value to register"
   */
  value: null | WAInstuctionWhenMemoryIsReady;

  address: null | WAInstuctionWhenMemoryIsReady;

  staticValue: number | null;
}

export interface CheckerWarning extends TokenLocation {
  msg: string;
}
