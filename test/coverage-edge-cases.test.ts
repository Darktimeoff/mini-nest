import 'reflect-metadata';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { Factory, Controller, Get, Post, Param, Query, Body, NotFoundException, UsePipes, UseFilters, type ExceptionFilterInterface } from '../src/index.js';
import type { PipeTransformInterface } from '../src/interface/pipe-transform.interface.js';

class UppercasePipe implements PipeTransformInterface {
  async transform(value: unknown) {
    return typeof value === 'string' ? value.toUpperCase() : value;
  }
}

@Controller('class-pipe')
@UsePipes(new UppercasePipe())
class ClassLevelPipeController {
  @Get(':id')
  async getById(@Param('id') id: string) {
    return { id };
  }
}

class UndecoratedFilter implements ExceptionFilterInterface {
  catch() {
    // never called: no @Catch() means this filter never matches any error
  }
}

@Controller('undecorated-filter')
@UseFilters(new UndecoratedFilter())
class UndecoratedFilterController {
  @Get('boom')
  async boom() {
    throw new Error('boom');
  }
}

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
    server = Factory.create([EdgeController, ClassLevelPipeController, UndecoratedFilterController]);
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

  it('a class-level @UsePipes() runs for every route on that controller', async () => {
    const res = await fetch(`${baseUrl}/class-pipe/abc`);
    const body = await res.json() as any;
    assert.equal(body.id, 'ABC');
  });

  it('a filter registered without @Catch() is skipped instead of crashing the pipeline', async () => {
    const res = await fetch(`${baseUrl}/undecorated-filter/boom`);
    assert.equal(res.status, 500);
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
