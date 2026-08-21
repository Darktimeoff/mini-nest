import type { ExecutionContextInterface } from "./execution-context.interface.js";

export interface GuardCanActivateInterface {
  canActivate(context: ExecutionContextInterface): boolean | Promise<boolean>
}