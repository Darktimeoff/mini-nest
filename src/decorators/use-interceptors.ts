import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { InterceptorInterface } from "../interface/interceptor.interface.js";
import { CreatePipelineDecorator } from "./create-pipeline-decorator.js";

export function UseInterceptors(...interceptors: InterceptorInterface[]) {
  return CreatePipelineDecorator(MetadataPropertyEnum.INTERCEPTORS, interceptors)
}