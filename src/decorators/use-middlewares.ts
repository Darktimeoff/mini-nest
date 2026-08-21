import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { MiddlewareInterface } from "../interface/middleware.interface.js";
import { CreatePipelineDecorator } from "./create-pipeline-decorator.js";

export function UseMiddlewares(...middlewares: MiddlewareInterface[]) {
  return CreatePipelineDecorator(MetadataPropertyEnum.MIDDLEWARES, middlewares)
}
