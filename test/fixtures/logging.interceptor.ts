import type { InterceptorInterface } from "../../src/interface/interceptor.interface.js";
import type { ExecutionContextInterface } from "../../src/interface/execution-context.interface.js";
import { RequestContext } from "./request-context.js";

export class LoggingInterceptor implements InterceptorInterface {
  intercept(context: ExecutionContextInterface) {
    const req = context.switchToHttp().getRequest();
    const start = performance.now();

    return (data: any) => {
      const duration = (performance.now() - start).toFixed(1);

      console.log(`[${RequestContext.requestId}] ${req.method} ${req.url} — ${duration} ms`);

      return data;
    }
  }
}
