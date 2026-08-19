import type { IncomingMessage } from "node:http";
import { HttpHandlerParamTypeEnum } from "../enum/http-handler-param-type.enum.js";
import { MetadataProperty } from "../enum/metadata-property.enum.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";
import { hasRequestBody } from "../util/has-request-body.util.js";
import { parseJsonBody } from "../util/parse-body-json.util.js";

export class HandlerBuilder {
  async build(route: RouteMethodHandlerInterface, req: IncomingMessage) {
    const args = await Promise.all(
      route.paramTypes.map(async (arg, index) => this.prepareArg(route, arg, index, req))
    )

    return () => route.method(...args)
  }

  private async prepareArg({params, queries, instance, method}: RouteMethodHandlerInterface, arg: any, index: number, req: IncomingMessage) {
    const paramMap = Reflect.getMetadata(MetadataProperty.METHOD_PARAM, Object.getPrototypeOf(instance), method.name) ?? {}
    const { type, name } = (paramMap[index] ?? {})

    if (type === HttpHandlerParamTypeEnum.PARAM) {
      return name ? params[name] : params
    }

    if (type === HttpHandlerParamTypeEnum.QUERY) {
      return name ? queries[name] : queries
    }

    if (type === HttpHandlerParamTypeEnum.BODY) {
      return hasRequestBody(req) ? await parseJsonBody(req) : undefined
    }

    return undefined
  }
}