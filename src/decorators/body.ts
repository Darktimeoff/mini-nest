import { HttpHandlerParamTypeEnum } from "../enum/http-handler-param-type.enum.js";
import { HttpHandlerParam } from "./http-handler-param.js";

export function Body() {
  return HttpHandlerParam(HttpHandlerParamTypeEnum.BODY)
}