import type { ExecutionHttpContextInterface } from "./execution-http-context.interface.js";

export interface ExecutionContextInterface {
  switchToHttp(): ExecutionHttpContextInterface
}