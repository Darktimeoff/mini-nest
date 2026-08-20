import type { ExecutionContextInterface } from "./execution-context.interface.js";

export type InterceptorPostHandlerType = (response: unknown) => unknown

export interface InterceptorInterface {
  intercept(context: ExecutionContextInterface): InterceptorPostHandlerType | Promise<InterceptorPostHandlerType>
}
