import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { ExceptionFilterInterface } from "../interface/exception-filter.interface.js";
import { CreatePipelineDecorator } from "./create-pipeline-decorator.js";

export function UseFilters(...filters: ExceptionFilterInterface[]) {
  return CreatePipelineDecorator(MetadataPropertyEnum.FILTERS, filters)
}