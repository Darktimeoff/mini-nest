import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js"
import type { ConstructorType } from "../type/constructor.type.js"
import { Injectable } from "./injectable.js"

export function Controller(prefix: string) {
  return (constructor: ConstructorType) => {
    Reflect.defineMetadata(MetadataPropertyEnum.CONTROLLER_PATH, prefix, constructor)
    Injectable()(constructor)
  }
}