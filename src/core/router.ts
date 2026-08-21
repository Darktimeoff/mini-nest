import type { HttpMethodEnum } from "../enum/http-method.enum.js";
import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";
import { isHttpMethod } from "../type-guard/is-http-method.type-guard.js";
import type { RouteType } from "../type/route.type.js";
import type { ConstructorType } from "../type/constructor.type.js";
import type { RouteHandlerMethodType } from "../type/route-handler-method.type.js";
import type { ControllerInstanceType } from "../type/controller-instance.type.js";
import { joinRoutePath } from "../util/join-route-path.util.js";

export class Router {
  private readonly routerHandlerMap: Record<string,  RouteType> = {}
  private routes: [string, RouteType][] = []

  build(controllers: ControllerInstanceType[]) {
    controllers.forEach(this.add.bind(this))

    this.routes = Object.entries(this.routerHandlerMap)
  }

  match(url: string, method: string): RouteMethodHandlerInterface | false | 'method-not-allowed' {
    const [pathname, query] = url.split('?') as [string, string | undefined]

    let pathMatched = false

    for (const [path, httpMap] of this.routes) {
      const pattern = new URLPattern({ pathname: path });

      if (!pattern.test({ pathname })) continue

      pathMatched = true

      if (method in httpMap && isHttpMethod(method) && httpMap[method]) {
        return {
          ...httpMap[method],
          params: pattern.exec({ pathname })?.pathname.groups ?? {},
          queries: Object.fromEntries(new URLSearchParams(query).entries())
        }
      }
    }

    return pathMatched ? 'method-not-allowed' : false
  }

  private add(controller: ControllerInstanceType) {
    const controllerPath: string = Reflect.getMetadata(MetadataPropertyEnum.CONTROLLER_PATH, controller.constructor)
    const methods = this.getInstanceMethods(controller)

    for (const methodName of methods) {
      const path: string = Reflect.getMetadata(MetadataPropertyEnum.METHOD_PATH, Object.getPrototypeOf(controller), methodName);
      const httpMethod: HttpMethodEnum = Reflect.getMetadata(MetadataPropertyEnum.METHOD_HTTP_OPERATION, Object.getPrototypeOf(controller), methodName);
      const paramTypes: ConstructorType[] = Reflect.getMetadata("design:paramtypes", Object.getPrototypeOf(controller), methodName) || []
      const normalizedPath = joinRoutePath(controllerPath, path)


      this.routerHandlerMap[normalizedPath] = {
        ...(this.routerHandlerMap[normalizedPath] ?? {}),
        [httpMethod]: {
          instance: controller,
          method: controller[methodName] as RouteHandlerMethodType,
          paramTypes,
        }
      }
    }
  }

  private getInstanceMethods(instance: ControllerInstanceType): string[] {
    const prototype = Object.getPrototypeOf(instance);

    if (!prototype) return [];


    return Object.getOwnPropertyNames(prototype).filter(propertyName => {
      const path = Reflect.getMetadata(MetadataPropertyEnum.METHOD_PATH, Object.getPrototypeOf(instance), propertyName);

      if (propertyName === "constructor" || typeof path !== 'string') return false;

      const propertyDescriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
      return typeof propertyDescriptor?.value === "function";
    });
  }
}
