import { MetadataProperty } from "../enum/metadata-property.enum.js";
import type { PipeTransformInterface } from "../interface/pipe-transform.interface.js";
import { CreateDecoratorFactory } from "./create-decorator-factory.js";

export function UsePipes(pipes: PipeTransformInterface[]) {
  return CreateDecoratorFactory(MetadataProperty.PIPES, pipes)
}