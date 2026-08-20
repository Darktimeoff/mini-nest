import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { GuardCanActivateInterface } from "../interface/guard-can-activate.interface.js";
import { CreatePipelineDecorator } from "./create-pipeline-decorator.js";

export function UseGuards(...guards: GuardCanActivateInterface[]) {
  return CreatePipelineDecorator(MetadataPropertyEnum.GUARDS, guards)
}