import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { PipeTransformInterface } from "../interface/pipe-transform.interface.js";
import { CreatePipelineDecorator } from "./create-pipeline-decorator.js";

export function UsePipes(...pipes: PipeTransformInterface[]) {
  return CreatePipelineDecorator(MetadataPropertyEnum.PIPES, pipes)
}