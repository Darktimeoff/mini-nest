import { MetadataProperty } from "../enum/metadata-property.enum.js"
import type { ConstructorType } from "../type/constructor.type.js"

export function Catch(...exceptions: ConstructorType[]) {
  return (constructor: ConstructorType) => {
    Reflect.defineMetadata(MetadataProperty.EXCEPTIONS, exceptions, constructor)
  }
}