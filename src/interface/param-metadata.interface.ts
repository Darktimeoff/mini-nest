import type { HttpHandlerParamTypeEnum } from "../enum/http-handler-param-type.enum.js";

export interface ParamMetadataInterface {
  type: HttpHandlerParamTypeEnum,
  name?: string | undefined
}
