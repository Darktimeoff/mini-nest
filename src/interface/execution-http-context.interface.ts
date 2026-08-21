import type { IncomingMessage, ServerResponse } from "node:http";

export interface ExecutionHttpContextInterface {
  getRequest(): IncomingMessage
  getResponse():  ServerResponse<IncomingMessage>
}