import { ParamTypeEnum } from "../enum/param-type.enum.js";
import { CreateParamDecorator } from "./create-param-decorator.js";

export function Body() {
  return CreateParamDecorator(ParamTypeEnum.BODY)
}