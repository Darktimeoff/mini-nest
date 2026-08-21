import 'reflect-metadata';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { Factory, Controller, Get, Param, UseMiddlewares } from '../src/index.js';
import { RequestContextMiddleware } from './fixtures/request-context.middleware.js';
import { RequestContext } from './fixtures/request-context.js';
import { UserService } from './fixtures/user.service.js';

const userService = new UserService();

@Controller('users')
@UseMiddlewares(new RequestContextMiddleware())
class UserController {
  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = userService.getById(id);

    return { ...user, requestId: RequestContext.requestId };
  }
}

describe('AsyncLocalStorage request context', () => {
  let server: Server;
  let port: number;
  let baseUrl: string;

  before(async () => {
    server = Factory.create([UserController]);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    port = typeof address === 'object' && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
  });

  after(() => {
    server.close();
  });

  it('generates a request id and returns it in the X-Request-Id header', async () => {
    const res = await fetch(`${baseUrl}/users/1`);
    const requestId = res.headers.get('x-request-id');

    assert.ok(requestId);

    const body = await res.json() as any;
    assert.equal(body.requestId, requestId);
  });

  it('echoes back a client-supplied X-Request-Id', async () => {
    const res = await fetch(`${baseUrl}/users/1`, {
      headers: { 'X-Request-Id': 'client-request-id-42' },
    });

    assert.equal(res.headers.get('x-request-id'), 'client-request-id-42');

    const body = await res.json() as any;
    assert.equal(body.requestId, 'client-request-id-42');
  });

  it('a service two levels deep reads the same request id from ALS, no parameter passed', async () => {
    const res = await fetch(`${baseUrl}/users/7`, {
      headers: { 'X-Request-Id': 'deep-service-id' },
    });

    const body = await res.json() as any;
    assert.equal(body.requestId, 'deep-service-id');
    assert.equal(body.id, '7');
  });

  it('does not leak request ids across concurrent requests', async () => {
    const requests = Array.from({ length: 10 }, (_, i) => i);

    const responses = await Promise.all(
      requests.map(async (i) => {
        const res = await fetch(`${baseUrl}/users/${i}`, {
          headers: { 'X-Request-Id': `req-${i}` },
        });
        return res.json() as Promise<any>;
      })
    );

    responses.forEach((body, i) => {
      assert.equal(body.requestId, `req-${i}`);
      assert.equal(body.id, String(i));
    });
  });
});
