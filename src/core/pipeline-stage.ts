import type { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";

export abstract class PipelineStage<T> {
  private readonly globalEntities: T[] = []

  constructor(private readonly metadataKey: MetadataPropertyEnum) {}

  useGlobal(...entities: T[]) {
    this.globalEntities.push(...entities)
  }

  protected getEntities(routeMethodHandler: RouteMethodHandlerInterface): T[] {
    const classEntities: T[] = Reflect.getMetadata(this.metadataKey, routeMethodHandler.instance.constructor) ?? []
    const methodEntities: T[] = Reflect.getMetadata(this.metadataKey, Object.getPrototypeOf(routeMethodHandler.instance), routeMethodHandler.method.name) ?? []

    return [...this.globalEntities, ...classEntities, ...methodEntities]
  }
}
