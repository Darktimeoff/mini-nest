import type { GuardCanActivateInterface } from "../../src/interface/guard-can-activate.interface.js";
import type { ExecutionContextInterface } from "../../src/interface/execution-context.interface.js";

export class AuthGuard implements GuardCanActivateInterface {
  canActivate(context: ExecutionContextInterface): boolean {
    const req = context.switchToHttp().getRequest();

    return Boolean(req.headers['authorization']);
  }
}
