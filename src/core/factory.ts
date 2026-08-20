import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { ConstructorType } from "../type/constructor.type.js";
import { Container } from "./container.js";
import { Router } from "./router.js";
import { HandlerBuilder } from "./handler-builder.js";
import { HttpException } from "../http-exception/http-exception.js";
import { MetadataProperty } from "../enum/metadata-property.enum.js";
import type { GuardCanActivateInterface } from "../interface/guard-can-activate.interface.js";
import { ForbiddenException } from "../http-exception/forbidden-exception.js";

export class Factory {
  static create(controllers: ConstructorType[]): Server<typeof IncomingMessage, typeof ServerResponse> {
    const container = new Container()
    const router = new Router()
    const handlerBuilder = new HandlerBuilder()
    
    const instances = controllers.map(c => container.resolve(c))
    router.build(instances)
    
    return createServer(async (req, res) => {
      const routeMethodHandler = req.url && req.method ? router.match(req.url, req.method) : false
      
      if (routeMethodHandler === false) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }

      const classGuards: GuardCanActivateInterface[] = Reflect.getMetadata(MetadataProperty.GUARDS, routeMethodHandler.instance.constructor) ?? []
      const methodGuards: GuardCanActivateInterface[] = Reflect.getMetadata(MetadataProperty.GUARDS, Object.getPrototypeOf(routeMethodHandler.instance), routeMethodHandler.method.name) ?? []
      const guards = [...classGuards, ...methodGuards];
      
      try {
        for (const guard of guards) {
          const result = await guard.canActivate({
            switchToHttp: () => ({
              getRequest: () => req
            })
          })

          if (!result) {
            throw new ForbiddenException()
          }
        }
        
        const handler = await handlerBuilder.build(routeMethodHandler, req)
        const result = await handler()
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (err) {
        if (err instanceof HttpException) {
          res.writeHead(err.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            message: err.message,
            details: err.details
          }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ message: 'Internal Server Error' }));
        }
      }
    })
  }
}