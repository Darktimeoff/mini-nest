import type { ExecutionContextInterface } from "./execution-context.interface.js";

export type NextFunction = () => Promise<void>;

export interface MiddlewareInterface {
  use(context: ExecutionContextInterface, next: NextFunction): void | Promise<void>
}
