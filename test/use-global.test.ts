import 'reflect-metadata';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  Factory, Controller, Get, Param, Catch,
  type GuardCanActivateInterface, type ExecutionContextInterface,
  type InterceptorInterface,
  type ExceptionFilterInterface, type MiddlewareInterface, type NextFunction,
} from '../src/index.js';
import type { PipeTransformInterface } from '../src/interface/pipe-transform.interface.js';

const order: string[] = [];

class GlobalMiddleware implements MiddlewareInterface {
  async use(_context: ExecutionContextInterface, next: NextFunction) {
    order.push('global:middleware');
    await next();
  }
}

class GlobalGuard implements GuardCanActivateInterface {
  canActivate(context: ExecutionContextInterface): boolean {
    const req = context.switchToHttp().getRequest();
    return Boolean(req.headers['authorization']);
  }
}

class GlobalInterceptor implements InterceptorInterface {
  intercept(_context: ExecutionContextInterface) {
    return (data: any) => ({ ...data, intercepted: true });
  }
}

class GlobalPipe implements PipeTransformInterface {
  async transform(value: unknown) {
    return typeof value === 'string' ? value.toUpperCase() : value;
  }
}

class GlobalError extends Error {}

@Catch(GlobalError)
class GlobalFilter implements ExceptionFilterInterface {
  catch(_exception: unknown, context: ExecutionContextInterface) {
    const res = context.switchToHttp().getResponse();
    res.writeHead(418, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: 'teapot' }));
  }
}

@Controller('global')
class GlobalController {
  @Get('boom')
  async boom() {
    throw new GlobalError('boom');
  }

  @Get(':name')
  async greet(@Param('name') name: string) {
    return { name };
  }
}

describe('Application.useGlobal*', () => {
  let app: ReturnType<typeof Factory.create>;
  let baseUrl: string;

  before(async () => {
    app = Factory.create([GlobalController]);
    app.useGlobalMiddlewares(new GlobalMiddleware());
    app.useGlobalGuards(new GlobalGuard());
    app.useGlobalInterceptors(new GlobalInterceptor());
    app.useGlobalPipes(new GlobalPipe());
    app.useGlobalFilters(new GlobalFilter());

    await new Promise<void>((resolve) => app.listen(0, resolve));
    const address = app.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
  });

  after(() => {
    app.close();
  });

  it('useGlobalGuards blocks a route with no local @UseGuards()', async () => {
    const res = await fetch(`${baseUrl}/global/alice`);
    assert.equal(res.status, 403);
  });

  it('useGlobalMiddlewares, useGlobalPipes and useGlobalInterceptors apply without local decorators', async () => {
    order.length = 0;

    const res = await fetch(`${baseUrl}/global/alice`, { headers: { Authorization: 'Bearer token' } });

    assert.equal(res.status, 200);
    const body = await res.json() as any;
    assert.equal(body.name, 'ALICE');
    assert.equal(body.intercepted, true);
    assert.ok(order.includes('global:middleware'));
  });

  it('useGlobalFilters maps an undecorated-route error without local @UseFilters()', async () => {
    const res = await fetch(`${baseUrl}/global/boom`, { headers: { Authorization: 'Bearer token' } });

    assert.equal(res.status, 418);
    const body = await res.json() as any;
    assert.equal(body.message, 'teapot');
  });
});
