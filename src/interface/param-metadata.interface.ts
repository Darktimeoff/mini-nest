import type { ParamTypeEnum } from "../enum/param-type.enum.js";

export interface ParamMetadataInterface {
  type: ParamTypeEnum,
  name?: string | undefined
}
