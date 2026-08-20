import { MetadataPropertyEnum } from "../enum/metadata-property.enum.js";
import { PipelineStage } from "./pipeline-stage.js";
import type { ExceptionFilterInterface } from "../interface/exception-filter.interface.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";
import type { ExecutionContextInterface } from "../interface/execution-context.interface.js";
import type { ConstructorType } from "../type/constructor.type.js";
import { HttpException } from "../http-exception/http-exception.js";
import { writeJson } from "../util/write-json.util.js";

export class ApplicationFilter extends PipelineStage<ExceptionFilterInterface> {
  constructor() {
    super(MetadataPropertyEnum.FILTERS)
  }

  apply(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface, error: unknown): boolean {
    const filters = this.getEntities(routeMethodHandler)

    for (const filter of filters) {
      const exceptions: ConstructorType[] = Reflect.getMetadata(MetadataPropertyEnum.EXCEPTIONS, filter.constructor) ?? []

      for (const exception of exceptions) {
        if (error instanceof exception) {
          filter.catch(error, context)

          const res = context.switchToHttp().getResponse()
          if (res.writableEnded) {
            return true
          }
        }
      }
    }

    return false
  }

  applyNotFound(context: ExecutionContextInterface) {
    const res = context.switchToHttp().getResponse()

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }

  applyMethodNotAllowed(context: ExecutionContextInterface) {
    const res = context.switchToHttp().getResponse()

    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405 Method Not Allowed');
  }

  applyDefault(context: ExecutionContextInterface, error: unknown) {
    const res = context.switchToHttp().getResponse()

    if (error instanceof HttpException) {
      writeJson(res, error.statusCode, { message: error.message, details: error.details })
      return;
    }

    writeJson(res, 500, { message: 'Internal Server Error' })
  }
}
