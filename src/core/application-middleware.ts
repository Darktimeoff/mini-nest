import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import { PipelineStage } from "./pipeline-stage.js";
import type { MiddlewareInterface, NextFunction } from "../interface/middleware.interface.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";
import type { ExecutionContextInterface } from "../interface/execution-context.interface.js";

export class ApplicationMiddleware extends PipelineStage<MiddlewareInterface> {
  constructor() {
    super(MetadataPropertyEnum.MIDDLEWARES)
  }

  async apply(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface, tail: NextFunction) {
    const middlewares = this.getEntities(routeMethodHandler)

    const chain = middlewares.reduceRight<NextFunction>(
      (next, middleware) => () => Promise.resolve(middleware.use(context, next)),
      tail
    )

    await chain()
  }
}
