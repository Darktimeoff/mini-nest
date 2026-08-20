import type { ExecutionContextInterface } from "./execution-context.interface.js";

export interface InterceptorInterface {
  intercept(context: ExecutionContextInterface): ((response: any) => any | Promise<any>) | Promise<((response: any) => any | Promise<any>)>
}