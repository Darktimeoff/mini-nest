import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { ConstructorType } from "../type/constructor.type.js";
import { Container } from "./container.js";
import { Router } from "./router.js";
import { HandlerBuilder } from "./handler-builder.js";
import { HttpException } from "../http-exception/http-exception.js";

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

      try {
        const handler = await handlerBuilder.build(routeMethodHandler, req)
        const result = await handler()
      } catch (err) {
        if (err instanceof HttpException) {
          res.writeHead(err.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            message: err.message,
            details: err.details
          }));
        }
      }
      
      res.end()
    })
  }
}