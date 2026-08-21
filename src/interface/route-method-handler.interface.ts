import type { ConstructorType } from "../type/constructor.type.js";
import type { RouteHandlerMethodType } from "../type/route-handler-method.type.js";

export interface RouteMethodHandlerInterface {
  instance: object,
  method: RouteHandlerMethodType,
  paramTypes: ConstructorType[],
  params: Record<string, string | undefined>,
  queries: Record<string, string | undefined>
}
