import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { GuardCanActivateInterface } from "../interface/guard-can-activate.interface.js";
import { CreateDecoratorFactory } from "./create-decorator-factory.js";

export function UseGuards(...guards: GuardCanActivateInterface[]) {
  return CreateDecoratorFactory(MetadataPropertyEnum.GUARDS, guards)
}