import type { ExceptionFilterInterface } from "../../src/interface/exception-filter.interface.js";
import type { ExecutionContextInterface } from "../../src/interface/execution-context.interface.js";
import { HttpException } from "../../src/http-exception/http-exception.js";
import { Catch } from "../../src/decorators/catch.js";
import { NotFoundError, ValidationError } from "./errors.js";

@Catch(Error)
export class ExceptionFilter implements ExceptionFilterInterface {
  catch(exception: unknown, context: ExecutionContextInterface) {
    const res = context.switchToHttp().getResponse();

    if (exception instanceof NotFoundError) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ message: exception.message }));
      return;
    }

    if (exception instanceof ValidationError) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ message: exception.message, fields: exception.fields }));
      return;
    }

    if (exception instanceof HttpException) {
      res.writeHead(exception.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ message: exception.message, details: exception.details }));
      return;
    }

    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: 'Internal Server Error' }));
  }
}
