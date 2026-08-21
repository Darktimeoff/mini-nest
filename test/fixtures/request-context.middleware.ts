import { randomUUID } from "node:crypto";
import type { MiddlewareInterface, NextFunction } from "../../src/interface/middleware.interface.js";
import type { ExecutionContextInterface } from "../../src/interface/execution-context.interface.js";
import { RequestContext } from "./request-context.js";

export class RequestContextMiddleware implements MiddlewareInterface {
  use(context: ExecutionContextInterface, next: NextFunction) {
    const { getRequest, getResponse } = context.switchToHttp();
    const req = getRequest();
    const res = getResponse();

    const requestId = (req.headers['x-request-id'] as string | undefined) || randomUUID();
    res.setHeader('X-Request-Id', requestId);

    return RequestContext.run({ requestId }, next);
  }
}
