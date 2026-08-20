import { ParamTypeEnum } from "../enum/param-type.enum.js";
import { CreateParamDecorator } from "./create-param-decorator.js";

export function Param(name?: string) {
  return CreateParamDecorator(ParamTypeEnum.PARAM, name)
}