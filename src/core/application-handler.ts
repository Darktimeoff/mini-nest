import type { IncomingMessage } from "node:http";
import { HttpHandlerParamTypeEnum } from "../enum/http-handler-param-type.enum.js";
import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";
import type { ExecutionContextInterface } from "../interface/execution-context.interface.js";
import { hasRequestBody } from "../util/has-request-body.util.js";
import { parseJsonBody } from "../util/parse-body-json.util.js";
import type { PipeTransformInterface } from "../interface/pipe-transform.interface.js";
import type { ConstructorType } from "../type/constructor.type.js";
import { PipelineStage } from "./pipeline-stage.js";

export class ApplicationHandler extends PipelineStage<PipeTransformInterface> {
  constructor() {
    super(MetadataPropertyEnum.PIPES)
  }

  async apply(route: RouteMethodHandlerInterface, context: ExecutionContextInterface) {
    const req = context.switchToHttp().getRequest()

    const args = await Promise.all(
      route.paramTypes.map(async (arg, index) => {
        const value = await this.prepareArg(route, arg, index, req);

        return await this.validateArgument(arg, value, route)
      })
    )

    return () => route.method.apply(route.instance, args)
  }

  private async validateArgument(initialMetadataType: ConstructorType, value: any, route: RouteMethodHandlerInterface) {
    const pipes = this.getEntities(route);

    let validatedValue = value;
    for (const pipe of pipes) {
      validatedValue = await pipe.transform(validatedValue, { metatype: initialMetadataType });
    }

    return validatedValue
  }

  private async prepareArg({ params, queries, instance, method }: RouteMethodHandlerInterface, arg: any, index: number, req: IncomingMessage) {
    const paramMap = Reflect.getMetadata(MetadataPropertyEnum.METHOD_PARAM, Object.getPrototypeOf(instance), method.name) ?? {}
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
