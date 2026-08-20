import type { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";

export abstract class PipelineStage<T> {
  constructor(private readonly metadataKey: MetadataPropertyEnum) {}

  protected getEntities(routeMethodHandler: RouteMethodHandlerInterface): T[] {
    const classEntities: T[] = Reflect.getMetadata(this.metadataKey, routeMethodHandler.instance.constructor) ?? []
    const methodEntities: T[] = Reflect.getMetadata(this.metadataKey, Object.getPrototypeOf(routeMethodHandler.instance), routeMethodHandler.method.name) ?? []

    return [...classEntities, ...methodEntities]
  }
}
