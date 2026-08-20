import type { HttpMethodEnum } from "../enum/http-method.enum.js";
import { MetadataProperty } from "../enum/metadata-property.enum.js";

export function HTTPHandler(method: HttpMethodEnum, path: string) {
  return (target: Object, methodName: string | symbol) => {
    Reflect.defineMetadata(MetadataProperty.METHOD_PATH, path, target, methodName)
    Reflect.defineMetadata(MetadataProperty.METHOD_HTTP_OPERATION, method,  target, methodName)
  }
}