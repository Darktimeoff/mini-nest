import { InjectableScope } from "../enum/injectable-scope.enum.js";
import { MetadataProperty } from "../enum/metadata-property.enum.js";
import type { InjectableOptionsInterface } from "../interface/injectable-options.interface.js";
import type { ConstructorType } from "../type/constructor.type.js";

export function Injectable({ scope }: InjectableOptionsInterface = { scope: InjectableScope.SINGLETON }) {
  return (constructor: ConstructorType) => {
    Reflect.defineMetadata(MetadataProperty.SCOPE, scope, constructor)
  }
}
