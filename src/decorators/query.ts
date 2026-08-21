import { ParamTypeEnum } from "../enum/param-type.enum.js";
import { CreateParamDecorator } from "./create-param-decorator.js";

export function Query(name?: string) {
  return CreateParamDecorator(ParamTypeEnum.QUERY, name)
}