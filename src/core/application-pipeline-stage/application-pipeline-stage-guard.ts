import { MetadataPropertyEnum } from "../../enum/metadata-property.enum.js";
import { ApplicationPipelineStage } from "./application-pipeline-stage.js";
import type { GuardCanActivateInterface } from "../../interface/guard-can-activate.interface.js";
import type { RouteMethodHandlerInterface } from "../../interface/route-method-handler.interface.js";
import type { ExecutionContextInterface } from "../../interface/execution-context.interface.js";
import { ForbiddenException } from "../../http-exception/forbidden-exception.js";

export class ApplicationPipelineStageGuard extends ApplicationPipelineStage<GuardCanActivateInterface> {
  constructor() {
    super(MetadataPropertyEnum.GUARDS)
  }

  async apply(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface) {
    const guards = this.getEntities(routeMethodHandler)

    for (const guard of guards) {
      const result = await guard.canActivate(context)

      if (!result) {
        throw new ForbiddenException()
      }
    }
  }
}
