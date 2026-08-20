import 'reflect-metadata';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { Factory, Controller, Get, Post, Param, Query, Body, NotFoundException } from '../src/index.js';

@Controller('edge')
class EdgeController {
  @Get('search')
  async wholeQuery(@Query() queries: unknown) {
    return queries;
  }

  @Get('no-body')
  async noBody(@Body() body: unknown) {
    return { body: body ?? null };
  }

  @Post()
  async create() {
    return { ok: true };
  }

  @Get('missing')
  async notFound() {
    throw new NotFoundException('Edge resource not found');
  }

  @Get(':id')
  async wholeParams(@Param() params: unknown) {
    return params;
  }
}

describe('Edge cases required for full branch coverage', () => {
  let server: Server;
  let port: number;
  let baseUrl: string;

  before(async () => {
    server = Factory.create([EdgeController]);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    port = typeof address === 'object' && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
  });

  after(() => {
    server.close();
  });

  it('@Param() with no name returns the whole params object', async () => {
    const res = await fetch(`${baseUrl}/edge/7`);
    const body = await res.json() as any;
    assert.equal(body.id, '7');
  });

  it('@Query() with no name returns the whole query object', async () => {
    const res = await fetch(`${baseUrl}/edge/search?a=1&b=2`);
    const body = await res.json() as any;
    assert.equal(body.a, '1');
    assert.equal(body.b, '2');
  });

  it('@Body() on a GET request (no body present) resolves to undefined', async () => {
    const res = await fetch(`${baseUrl}/edge/no-body`);
    const body = await res.json() as any;
    assert.equal(body.body, null);
  });

  it('framework NotFoundException maps to 404', async () => {
    const res = await fetch(`${baseUrl}/edge/missing`);
    assert.equal(res.status, 404);
    const body = await res.json() as any;
    assert.equal(body.message, 'Edge resource not found');
  });

  it('returns 404 when the path matches but the HTTP method is not registered', async () => {
    const res = await fetch(`${baseUrl}/edge/7`, { method: 'DELETE' });
    assert.equal(res.status, 404);
  });

  it('returns 404 when there are no routes at all', async () => {
    const emptyServer = Factory.create([]);
    await new Promise<void>((resolve) => emptyServer.listen(0, resolve));
    const address = emptyServer.address();
    const emptyPort = typeof address === 'object' && address ? address.port : 0;

    const res = await fetch(`http://localhost:${emptyPort}/anything`);
    assert.equal(res.status, 404);

    await new Promise<void>((resolve) => emptyServer.close(() => resolve()));
  });

  it('returns 404 when the request object has no url/method', async () => {
    const status = await new Promise<number>((resolve) => {
      const fakeReq = {} as any;
      const fakeRes = {
        writeHead(code: number) {
          resolve(code);
          return fakeRes;
        },
        end() {},
      } as any;

      server.emit('request', fakeReq, fakeRes);
    });

    assert.equal(status, 404);
  });
});
