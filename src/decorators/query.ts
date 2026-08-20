import { HttpHandlerParamTypeEnum } from "../enum/http-handler-param-type.enum.js";
import { HttpHandlerParam } from "./http-handler-param.js";

export function Query(name?: string) {
  return HttpHandlerParam(HttpHandlerParamTypeEnum.QUERY, name)
}