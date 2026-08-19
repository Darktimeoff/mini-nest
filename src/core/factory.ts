import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { ConstructorType } from "../type/constructor.type.js";
import { Container } from "./container.js";
import { Router } from "./router.js";

export class Factory {
  static create(controllers: ConstructorType[]): Server<typeof IncomingMessage, typeof ServerResponse> {
    const container = new Container()
    const router = new Router()
    
    controllers.forEach(c => {
      const controller = container.resolve(c)
      router.add(controller)
    })
    
    return createServer((req, res) => {
      console.log(req.url, req.method)
      res.end()
    })
  }
}