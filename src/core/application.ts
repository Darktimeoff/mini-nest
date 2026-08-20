import { Server, type IncomingMessage, type ServerResponse } from "node:http";
import type { ConstructorType } from "../type/constructor.type.js";
import { Container } from "./container.js";
import { Router } from "./router.js";
import { ApplicationHandler } from "./application-handler.js";
import { ApplicationMiddleware } from "./application-middleware.js";
import { ApplicationGuard } from "./application-guard.js";
import { ApplicationInterceptor } from "./application-interceptor.js";
import { ApplicationFilter } from "./application-filter.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";
import type { ExecutionContextInterface } from "../interface/execution-context.interface.js";
import { ExecutionContext } from "./execution-context.js";
import { writeJson } from "../util/write-json.util.js";
import type { ControllerInstanceType } from "../type/controller-instance.type.js";
import type { GuardCanActivateInterface } from "../interface/guard-can-activate.interface.js";
import type { InterceptorInterface } from "../interface/interceptor.interface.js";
import type { PipeTransformInterface } from "../interface/pipe-transform.interface.js";
import type { ExceptionFilterInterface } from "../interface/exception-filter.interface.js";
import type { MiddlewareInterface } from "../interface/middleware.interface.js";

export class Application extends Server {
  private readonly router = new Router()
  private readonly handlerStage = new ApplicationHandler()
  private readonly middlewareStage = new ApplicationMiddleware()
  private readonly guardStage = new ApplicationGuard()
  private readonly interceptorStage = new ApplicationInterceptor()
  private readonly filterStage = new ApplicationFilter()

  constructor(controllers: ConstructorType[]) {
    super()

    const container = new Container()
    const instances = controllers.map(c => container.resolve(c) as ControllerInstanceType)
    this.router.build(instances)

    this.on('request', this.handleRequest.bind(this))
  }

  useGlobalGuards(...guards: GuardCanActivateInterface[]) {
    this.guardStage.useGlobal(...guards)
  }

  useGlobalInterceptors(...interceptors: InterceptorInterface[]) {
    this.interceptorStage.useGlobal(...interceptors)
  }

  useGlobalPipes(...pipes: PipeTransformInterface[]) {
    this.handlerStage.useGlobal(...pipes)
  }

  useGlobalFilters(...filters: ExceptionFilterInterface[]) {
    this.filterStage.useGlobal(...filters)
  }

  useGlobalMiddlewares(...middlewares: MiddlewareInterface[]) {
    this.middlewareStage.useGlobal(...middlewares)
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const context: ExecutionContextInterface = new ExecutionContext(req, res)

    const routeMethodHandler = req.url && req.method ? this.router.match(req.url, req.method) : false

    if (routeMethodHandler === 'method-not-allowed') {
      this.filterStage.applyMethodNotAllowed(context)
      return;
    }

    if (routeMethodHandler === false) {
      this.filterStage.applyNotFound(context)
      return;
    }

    try {
      const runPipeline = () => this.runPipeline(routeMethodHandler, context)

      await this.middlewareStage.apply(routeMethodHandler, context, runPipeline)
    } catch (err) {
      const isApplied = this.filterStage.apply(routeMethodHandler, context, err)

      if (!isApplied) {
        this.filterStage.applyDefault(context, err)
      }
    }
  }

  private async runPipeline(routeMethodHandler: RouteMethodHandlerInterface, context: ExecutionContextInterface) {
    await this.guardStage.apply(routeMethodHandler, context)

    const executeHandler = async () => {
      const handler = await this.handlerStage.apply(routeMethodHandler, context)
      return await handler()
    }

    const result = await this.interceptorStage.apply(routeMethodHandler, context, executeHandler)

    writeJson(context.switchToHttp().getResponse(), 200, result)
  }
}
