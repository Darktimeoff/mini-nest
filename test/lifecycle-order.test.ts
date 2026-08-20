import 'reflect-metadata';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import {
  Factory, Controller, Get, Param, UseGuards, UseInterceptors, UsePipes,
  UseMiddlewares,
  type GuardCanActivateInterface, type ExecutionContextInterface,
  type InterceptorInterface, type MiddlewareInterface, type NextFunction,
} from '../src/index.js';
import type { PipeTransformInterface } from '../src/interface/pipe-transform.interface.js';

const order: string[] = [];

class OrderMiddleware implements MiddlewareInterface {
  async use(_context: ExecutionContextInterface, next: NextFunction) {
    order.push('middleware');
    await next();
  }
}

class OrderGuard implements GuardCanActivateInterface {
  canActivate(): boolean {
    order.push('guard');
    return true;
  }
}

class OrderInterceptor implements InterceptorInterface {
  intercept(_context: ExecutionContextInterface) {
    order.push('interceptor:before');

    return (data: any) => {
      order.push('interceptor:after');
      return data;
    }
  }
}

class OrderPipe implements PipeTransformInterface {
  async transform(value: unknown) {
    order.push('pipe');
    return value;
  }
}

@Controller('order')
class OrderController {
  @UseMiddlewares(new OrderMiddleware())
  @UseGuards(new OrderGuard())
  @UseInterceptors(new OrderInterceptor())
  @UsePipes([new OrderPipe()])
  @Get(':id')
  async handle(@Param('id') id: string) {
    order.push('handler');
    return { id };
  }
}

describe('Request lifecycle order', () => {
  let server: Server;
  let port: number;

  before(async () => {
    server = Factory.create([OrderController]);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    port = typeof address === 'object' && address ? address.port : 0;
  });

  after(() => {
    server.close();
  });

  it('executes middleware, guard, interceptor, pipe, handler in the exact expected order', async () => {
    const res = await fetch(`http://localhost:${port}/order/1`);

    assert.equal(res.status, 200);
    assert.deepEqual(order, [
      'middleware',
      'guard',
      'interceptor:before',
      'pipe',
      'handler',
      'interceptor:after',
    ]);
  });
});
