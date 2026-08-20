import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import { PipelineStage } from "./pipeline-stage.js";
import type { InterceptorInterface } from "../interface/interceptor.interface.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";
import type { ExecutionContextInterface } from "../interface/execution-context.interface.js";

export class ApplicationInterceptor extends PipelineStage<InterceptorInterface> {
  constructor() {
    super(MetadataPropertyEnum.INTERCEPTORS)
  }

  async apply(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface, handler: Function) {
    const interceptors = this.getEntities(routeMethodHandler)

    const queues: ((response: any) => any | Promise<any>)[] = []

    for (const interceptor of interceptors) {
      queues.push(await interceptor.intercept(context))
    }

    let result = await handler()

    for (const postHandler of queues) {
      result = await postHandler(result)
    }

    return result
  }
}
