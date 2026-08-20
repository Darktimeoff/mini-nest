import type { ExecutionContextInterface } from "./execution-context.interface.js";

export interface ExceptionFilterInterface {
  catch(exception: unknown, context: ExecutionContextInterface): void
}