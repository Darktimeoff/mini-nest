import { MetadataProperty } from "../enum/metadata-property.enum.js";
import type { ExceptionFilterInterface } from "../interface/exception-filter.interface.js";
import { CreateDecoratorFactory } from "./create-decorator-factory.js";

export function UseFilters(...filters: ExceptionFilterInterface[]) {
  return CreateDecoratorFactory(MetadataProperty.FILTERS, filters)
}