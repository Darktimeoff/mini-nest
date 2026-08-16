import { InjectableScope } from "./enum/injectable-scope.enum.js";
import { MetadataProperty } from "./enum/metadata-property.enum.js";
import type { ConstructorType } from "./type/constructor.type.js";
import type { InjectTokenType } from "./type/inject-token.type.js";

export class Container {
  private instanceMap: Map<ConstructorType, object> = new Map()
  private tokenMap: Map<InjectTokenType, ConstructorType> = new Map()

  resolve<T extends object>(constructor: ConstructorType<T>, path: string[] = []): T {
    this.assertConstructorValidation(constructor, path)

    if (this.instanceMap.has(constructor)) {
      return this.instanceMap.get(constructor) as T;
    }

    const args = this.resolveDependencies(constructor, path)

    return this.buildInstance(constructor, args)
  }

  bind(token: InjectTokenType, constructor: ConstructorType) {
    this.tokenMap.set(token, constructor)
  }

  private assertConstructorValidation(constructor: ConstructorType, path: string[]) {
    const scope = this.getScope(constructor)

    if (!scope) {
      throw new Error('Class not marked like injectable')
    }

    if (path.includes(constructor.name)) {
      throw new Error(`Cycle dependencies detected: ${[...path, constructor.name].join(' -> ')}`)
    }
  }

  private resolveDependencies(constructor: ConstructorType, path: string[]) {
    const deps: ConstructorType[] = Reflect.getOwnMetadata('design:paramtypes', constructor) ?? []

    return deps.map((d, index) => {
       const target = this.resolveTokenDependencyOrFail(constructor, index) ?? d
       return this.resolve(target, [...path, constructor.name])
    })
  }

  private resolveTokenDependencyOrFail(constructor: ConstructorType, index: number) {
    const argTokenMap = Reflect.getMetadata(MetadataProperty.TOKEN, constructor) ?? {}
    const token = argTokenMap[index] as (InjectTokenType | undefined)

    const binded = token ? this.tokenMap.get(token) : null

    if (token && !binded) {
      throw new Error(`Nothing not binded to token ${String(token)}, please call .bind(${String(token)}, Class)`)
    }

    return binded
  }

  private buildInstance<T>(constructor: ConstructorType, args: object[]) {
    const instance = new constructor(...args)

    if (this.getScope(constructor) === InjectableScope.SINGLETON) {
      this.instanceMap.set(constructor, instance)
    }

    return instance as T
  }

  private getScope(constructor: ConstructorType) {
    return Reflect.getOwnMetadata(MetadataProperty.SCOPE, constructor) as InjectableScope
  }
}
