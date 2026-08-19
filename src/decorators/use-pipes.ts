import { MetadataProperty } from "../enum/metadata-property.enum.js";
import type { PipeTransformInterface } from "../interface/pipe-transform.interface.js";

export function UsePipes(pipes: PipeTransformInterface[]) {
  return (target: Object, methodName: string | symbol) => { 
     Reflect.defineMetadata(MetadataProperty.PIPES, pipes, target, methodName)
  }
}