import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { MiddlewareInterface } from "../interface/middleware.interface.js";
import { CreateDecoratorFactory } from "./create-decorator-factory.js";

export function UseMiddlewares(...middlewares: MiddlewareInterface[]) {
  return CreateDecoratorFactory(MetadataPropertyEnum.MIDDLEWARES, middlewares)
}
