import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { ConstructorType } from "../type/constructor.type.js";
import type { InjectTokenType } from "../type/inject-token.type.js";

export function Inject(token: InjectTokenType) {
  return (constructor: ConstructorType, propertyKey: InjectTokenType | undefined, parameterIndex: number) => {
    const existingMetadata: Record<number, string | Symbol> =
          Reflect.getOwnMetadata(MetadataPropertyEnum.TOKEN, constructor, propertyKey!) || {};

    existingMetadata[parameterIndex] = token;

    Reflect.defineMetadata(MetadataPropertyEnum.TOKEN, existingMetadata, constructor, propertyKey as InjectTokenType)
  }
}
