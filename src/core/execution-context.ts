import type { IncomingMessage, ServerResponse } from "node:http";
import type { ExecutionContextInterface } from "../interface/execution-context.interface.js";
import type { ExecutionHttpContextInterface } from "../interface/execution-http-context.interface.js";

export class ExecutionContext implements ExecutionContextInterface {
  constructor(private readonly req: IncomingMessage, private readonly res: ServerResponse) {}

  switchToHttp(): ExecutionHttpContextInterface {
    return {
      getRequest: () => this.req,
      getResponse: () => this.res
    }
  }
}
