import type { HttpHandlerParamTypeEnum } from "../enum/http-handler-param-type.enum.js";
import { MetadataProperty } from "../enum/metadata-property.enum.js";
import type { InjectTokenType } from "../type/inject-token.type.js";

export function HttpHandlerParam(paramType: HttpHandlerParamTypeEnum, name?: string) {
  return (constructor: object, propertyKey: InjectTokenType | undefined, parameterIndex: number) => { 
    const existingMetadata = Reflect.getOwnMetadata(MetadataProperty.METHOD_PARAM, constructor, propertyKey!) || {};

    existingMetadata[parameterIndex] = {
      type: paramType,
      name
    };

    Reflect.defineMetadata(MetadataProperty.METHOD_PARAM, existingMetadata, constructor, propertyKey as InjectTokenType)
  }
}