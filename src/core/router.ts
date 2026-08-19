import type { HttpMethodEnum } from "../enum/http-method.enum.js";
import { MetadataProperty } from "../enum/metadata-property.enum.js";

export class Router {
  private readonly routerHandlerMap = new Map()

  add(controller: object) {
    const controllerPath: string = Reflect.getMetadata(MetadataProperty.CONTROLLER_PATH, controller.constructor)
    const methods = this.getInstanceMethods(controller)
    
    for (const methodName of methods) {
      const path: string = Reflect.getMetadata(MetadataProperty.METHOD_PATH, Object.getPrototypeOf(controller), methodName);
      const httpMethod: HttpMethodEnum = Reflect.getMetadata(MetadataProperty.METHOD_HTTP_OPERATION, Object.getPrototypeOf(controller), methodName);
      const normalizedPath = `/${controllerPath.replaceAll('/', '')}${path.length > 0 ? '/' : ''}${path.replaceAll('/', '')}`

      
      this.routerHandlerMap.set(normalizedPath, {
        ...(this.routerHandlerMap.get(normalizedPath) ?? {}),
        [httpMethod]: controller[methodName]
      })
    }

    console.log(this.routerHandlerMap)
  }

  private getInstanceMethods<T extends Object>(instance: any): (keyof T)[] {
    const prototype = Object.getPrototypeOf(instance);
    
    if (!prototype) return [] as unknown as (keyof T)[];
  
    
    return Object.getOwnPropertyNames(prototype).filter(propertyName => {
      const path = Reflect.getMetadata(MetadataProperty.METHOD_PATH, Object.getPrototypeOf(instance), propertyName);
      
      
      if (propertyName === "constructor" || typeof path !== 'string') return false;
      
      const propertyDescriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
      return typeof propertyDescriptor?.value === "function";
    }) as unknown as (keyof T)[];
  }
}