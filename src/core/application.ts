import { Server, type IncomingMessage, type ServerResponse } from "node:http";
import type { ConstructorType } from "../type/constructor.type.js";
import { Container } from "./container.js";
import { Router } from "./router.js";
import { HandlerBuilder } from "./handler-builder.js";
import { HttpException } from "../http-exception/http-exception.js";
import { MetadataProperty } from "../enum/metadata-property.enum.js";
import type { GuardCanActivateInterface } from "../interface/guard-can-activate.interface.js";
import { ForbiddenException } from "../http-exception/forbidden-exception.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";
import type { InterceptorInterface } from "../interface/interceptor.interface.js";
import type { ExecutionContextInterface } from "../interface/execution-context.interface.js";
import type { ExceptionFilterInterface } from "../interface/exception-filter.interface.js";
import type { MiddlewareInterface, NextFunction } from "../interface/middleware.interface.js";

export class Application extends Server {
  private readonly router = new Router()
  private readonly handlerBuilder = new HandlerBuilder()

  constructor(controllers: ConstructorType[]) {
    super()

    const container = new Container()
    const instances = controllers.map(c => container.resolve(c))
    this.router.build(instances)

    this.on('request', this.handleRequest.bind(this))
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const routeMethodHandler = req.url && req.method ? this.router.match(req.url, req.method) : false

    if (routeMethodHandler === false) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const context: ExecutionContextInterface = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res
      })
    }

    try {
      const runPipeline = () => this.runPipeline(routeMethodHandler, context)

      await this.applyMiddlewares(routeMethodHandler, context, runPipeline)
    } catch (err) {
      const isApplied = this.applyFilters(routeMethodHandler, context, err)

      if (err instanceof HttpException && !isApplied) {
        res.writeHead(err.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          message: err.message,
          details: err.details
        }));
      } else if(!isApplied) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: 'Internal Server Error' }));
      }
    }
  }

  private async runPipeline(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface) {
    await this.applyGuards(routeMethodHandler, context)

    const execturHandler = async () => {
      const handler = await this.handlerBuilder.build(routeMethodHandler, context.switchToHttp().getRequest())
      return await handler()
    }

    const result = await this.applyInterceptors(routeMethodHandler, context, execturHandler)

    const res = context.switchToHttp().getResponse()
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
  }

  private applyFilters(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface, error: unknown) {
    const classGuards: ExceptionFilterInterface[] = Reflect.getMetadata(MetadataProperty.FILTERS, routeMethodHandler.instance.constructor) ?? []
    const methodGuards: ExceptionFilterInterface[] = Reflect.getMetadata(MetadataProperty.FILTERS, Object.getPrototypeOf(routeMethodHandler.instance), routeMethodHandler.method.name) ?? []
    const filters = [...classGuards, ...methodGuards];

    for (const filter of filters) {
      const exceptions: ConstructorType[] = Reflect.getMetadata(MetadataProperty.EXCEPTIONS, filter.constructor)

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

  private async applyMiddlewares(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface, tail: NextFunction) {
    const classMiddlewares: MiddlewareInterface[] = Reflect.getMetadata(MetadataProperty.MIDDLEWARES, routeMethodHandler.instance.constructor) ?? []
    const methodMiddlewares: MiddlewareInterface[] = Reflect.getMetadata(MetadataProperty.MIDDLEWARES, Object.getPrototypeOf(routeMethodHandler.instance), routeMethodHandler.method.name) ?? []
    const middlewares = [...classMiddlewares, ...methodMiddlewares];

    const chain = middlewares.reduceRight<NextFunction>(
      (next, middleware) => () => Promise.resolve(middleware.use(context, next)),
      tail
    )

    await chain()
  }

  private async applyGuards(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface) {
    const classGuards: GuardCanActivateInterface[] = Reflect.getMetadata(MetadataProperty.GUARDS, routeMethodHandler.instance.constructor) ?? []
    const methodGuards: GuardCanActivateInterface[] = Reflect.getMetadata(MetadataProperty.GUARDS, Object.getPrototypeOf(routeMethodHandler.instance), routeMethodHandler.method.name) ?? []
    const guards = [...classGuards, ...methodGuards];

    for (const guard of guards) {
      const result = await guard.canActivate(context)

      if (!result) {
        throw new ForbiddenException()
      }
    }
  }

  private async applyInterceptors(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface, handler: Function) {
    const classes: InterceptorInterface[] = Reflect.getMetadata(MetadataProperty.INTERCEPTORS, routeMethodHandler.instance.constructor) ?? []
    const methods: InterceptorInterface[] = Reflect.getMetadata(MetadataProperty.INTERCEPTORS, Object.getPrototypeOf(routeMethodHandler.instance), routeMethodHandler.method.name) ?? []
    const interceptos = [...classes, ...methods];

    const queues: ((response: any) => any | Promise<any>)[] = []

    for (const interceptor of interceptos) {
      queues.push(await interceptor.intercept(context))
    }

    let result = await handler()

    for (const postHandler of queues) {
      result = await postHandler(result)
    }

    return result
  }
}
