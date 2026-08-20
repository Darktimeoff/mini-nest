import type { HttpHandlerParamTypeEnum } from "../enum/http-handler-param-type.enum.js";
import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { InjectTokenType } from "../type/inject-token.type.js";
import type { ParamMetadataInterface } from "../interface/param-metadata.interface.js";

export function HttpHandlerParam(paramType: HttpHandlerParamTypeEnum, name?: string) {
  return (constructor: object, propertyKey: InjectTokenType | undefined, parameterIndex: number) => {
    const existingMetadata: Record<number, ParamMetadataInterface> =
          Reflect.getOwnMetadata(MetadataPropertyEnum.METHOD_PARAM, constructor, propertyKey!) || {};

    existingMetadata[parameterIndex] = {
      type: paramType,
      name
    };

    Reflect.defineMetadata(MetadataPropertyEnum.METHOD_PARAM, existingMetadata, constructor, propertyKey as InjectTokenType)
  }
}
