import type { IncomingMessage } from "node:http";

export interface ExecutionHttpContextInterface {
  getRequest(): IncomingMessage
}