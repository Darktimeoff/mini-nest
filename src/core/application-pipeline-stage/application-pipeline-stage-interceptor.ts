import { MetadataPropertyEnum } from "../../enum/metadata-property.enum.js";
import { ApplicationPipelineStage } from "./application-pipeline-stage.js";
import type { InterceptorInterface, InterceptorPostHandlerType } from "../../interface/interceptor.interface.js";
import type { RouteMethodHandlerInterface } from "../../interface/route-method-handler.interface.js";
import type { ExecutionContextInterface } from "../../interface/execution-context.interface.js";

export class ApplicationPipelineStageInterceptor extends ApplicationPipelineStage<InterceptorInterface> {
  constructor() {
    super(MetadataPropertyEnum.INTERCEPTORS)
  }

  async apply(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface, handler: () => Promise<unknown>) {
    const interceptors = this.getEntities(routeMethodHandler)

    const queues: InterceptorPostHandlerType[] = []

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
