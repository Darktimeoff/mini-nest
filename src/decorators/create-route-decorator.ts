import type { HttpMethodEnum } from "../enum/http-method.enum.js";
import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";

export function CreateRouteDecorator(method: HttpMethodEnum, path: string) {
  return (target: object, methodName: string | symbol) => {
    Reflect.defineMetadata(MetadataPropertyEnum.METHOD_PATH, path, target, methodName)
    Reflect.defineMetadata(MetadataPropertyEnum.METHOD_HTTP_OPERATION, method,  target, methodName)
  }
}