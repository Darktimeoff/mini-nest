import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { ConstructorType } from "../type/constructor.type.js";
import { Container } from "./container.js";
import { Router } from "./router.js";

export class Factory {
  static create(controllers: ConstructorType[]): Server<typeof IncomingMessage, typeof ServerResponse> {
    const container = new Container()
    const router = new Router()
    
    const instances = controllers.map(c => container.resolve(c))
    router.build(instances)
    
    return createServer((req, res) => {
      const handler = req.url && req.method ? router.match(req.url, req.method) : false
      if (!handler) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      }
      
      res.end()
    })
  }
}