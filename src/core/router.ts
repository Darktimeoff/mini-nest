import type { HttpMethodEnum } from "../enum/http-method.enum.js";
import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";
import { isHttpMethod } from "../type-guard/is-http-method.type-guard.js";
import type { RouteType } from "../type/route.type.js";

export class Router {
  private readonly routerHandlerMap: Record<string,  RouteType> = {}
  private routes: [string, RouteType][] = []

  build(controllers: object[]) {
    controllers.forEach(this.add.bind(this))
    
    this.routes = Object.entries(this.routerHandlerMap)
  }

  match(url: string, method: string): RouteMethodHandlerInterface | false  {
    const [pathname, query] = url.split('?') as [string, string | undefined]
    
    for (const [path, httpMap] of this.routes) {
      const pattern = new URLPattern({ pathname: path });
      if (pattern.test({pathname: pathname})) {
        return method in httpMap && isHttpMethod(method) && httpMap[method] ? {
          ...httpMap[method],
          params: pattern.exec({ pathname: pathname })?.pathname.groups ?? {},
          queries: Object.fromEntries(new URLSearchParams(query).entries())
        } : false
      }
    }

    return false
  }

  private add(controller: object) {
    const controllerPath: string = Reflect.getMetadata(MetadataPropertyEnum.CONTROLLER_PATH, controller.constructor)
    const methods = this.getInstanceMethods(controller)
    
    for (const methodName of methods) {
      const path: string = Reflect.getMetadata(MetadataPropertyEnum.METHOD_PATH, Object.getPrototypeOf(controller), methodName);
      const httpMethod: HttpMethodEnum = Reflect.getMetadata(MetadataPropertyEnum.METHOD_HTTP_OPERATION, Object.getPrototypeOf(controller), methodName);
      const normalizedPath = `/${controllerPath.replaceAll('/', '')}${path.length > 0 ? '/' : ''}${path.replaceAll('/', '')}`

      
      this.routerHandlerMap[normalizedPath] = {
        ...(this.routerHandlerMap[normalizedPath] ?? {}),
        [httpMethod]: {
          instance: controller,
          method: controller[methodName],
          paramTypes: Reflect.getMetadata("design:paramtypes", Object.getPrototypeOf(controller), methodName) || [],
        }
      }
    }
  }

  private getInstanceMethods<T extends Object>(instance: any): (keyof T)[] {
    const prototype = Object.getPrototypeOf(instance);
    
    if (!prototype) return [] as unknown as (keyof T)[];
  
    
    return Object.getOwnPropertyNames(prototype).filter(propertyName => {
      const path = Reflect.getMetadata(MetadataPropertyEnum.METHOD_PATH, Object.getPrototypeOf(instance), propertyName);
      
      
      if (propertyName === "constructor" || typeof path !== 'string') return false;
      
      const propertyDescriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
      return typeof propertyDescriptor?.value === "function";
    }) as unknown as (keyof T)[];
  }
}