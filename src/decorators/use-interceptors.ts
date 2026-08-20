import { MetadataProperty } from "../enum/metadata-property.enum.js";
import type { InterceptorInterface } from "../interface/interceptor.interface.js";
import { CreateDecoratorFactory } from "./create-decorator-factory.js";

export function UseInterceptors(...interceptors: InterceptorInterface[]) {
  return CreateDecoratorFactory(MetadataProperty.INTERCEPTORS, interceptors)
}