import 'reflect-metadata';
import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { z } from 'zod';
import {
  Factory, Controller, Get, Post, Param, Body, UseGuards, UseInterceptors, UsePipes, UseFilters,
} from '../src/index.js';
import { AuthGuard } from './fixtures/auth.guard.js';
import { LoggingInterceptor } from './fixtures/logging.interceptor.js';
import { ZodValidationPipe } from './fixtures/zod-validation.pipe.js';
import { ExceptionFilter } from './fixtures/exception.filter.js';
import { NotFoundError, ValidationError } from './fixtures/errors.js';

const handlerSpy = mock.fn();

@Controller('protected')
class ProtectedController {
  @UseGuards(new AuthGuard())
  @UseInterceptors(new LoggingInterceptor())
  @Get(':id')
  async getById(@Param('id') id: string) {
    handlerSpy(id);
    return { id };
  }
}

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  age: z.int().min(16),
});

@Controller('demo-users')
class DemoUsersController {
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  @Post()
  async create(@Body() body: unknown) {
    return body;
  }
}

@Controller('domain-errors')
@UseFilters(new ExceptionFilter())
class DomainErrorController {
  @Get('not-found')
  async notFound() {
    throw new NotFoundError('User 42 not found');
  }

  @Get('validation')
  async validation() {
    throw new ValidationError(['email'], 'Invalid email');
  }

  @Get('boom')
  async boom() {
    throw new Error('boom');
  }
}

const capturedLogs: string[] = [];
const originalConsoleLog = console.log;

describe('Guards, interceptors, pipes, filters (lifecycle stages)', () => {
  let server: Server;
  let port: number;
  let baseUrl: string;

  before(async () => {
    console.log = (...args: unknown[]) => {
      capturedLogs.push(args.join(' '));
      originalConsoleLog(...args);
    };

    server = Factory.create([ProtectedController, DemoUsersController, DomainErrorController]);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    port = typeof address === 'object' && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
  });

  after(() => {
    console.log = originalConsoleLog;
    server.close();
  });

  it('blocks the request with 403 and never calls the handler when Authorization is missing', async () => {
    handlerSpy.mock.resetCalls();

    const res = await fetch(`${baseUrl}/protected/1`);

    assert.equal(res.status, 403);
    assert.equal(handlerSpy.mock.callCount(), 0);
  });

  it('calls the handler once Authorization is present', async () => {
    handlerSpy.mock.resetCalls();

    const res = await fetch(`${baseUrl}/protected/1`, {
      headers: { Authorization: 'Bearer token' },
    });

    assert.equal(res.status, 200);
    assert.equal(handlerSpy.mock.callCount(), 1);
  });

  it('logs the route and duration in milliseconds', async () => {
    capturedLogs.length = 0;

    await fetch(`${baseUrl}/protected/1`, {
      headers: { Authorization: 'Bearer token' },
    });

    const logLine = capturedLogs.find((line) => /GET .*ms/.test(line));
    assert.ok(logLine, 'expected a log line with route and duration');
    assert.match(logLine!, /[0-9]+(\.[0-9]+)? ?ms/);
  });

  it('rejects an invalid body with 400 and a list of fields', async () => {
    const res = await fetch(`${baseUrl}/demo-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'a', email: 'not-an-email', age: 10 }),
    });

    assert.equal(res.status, 400);
    const body = await res.json() as any;
    assert.ok(Array.isArray(body.details));
    assert.ok(body.details.length > 0);
    assert.ok(body.details.some((d: any) => d.field === 'email'));
  });

  it('accepts a valid body and parses it via Zod', async () => {
    const res = await fetch(`${baseUrl}/demo-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@example.com', age: 20 }),
    });

    assert.equal(res.status, 200);
    const body = await res.json() as any;
    assert.equal(body.name, 'Alice');
  });

  it('maps a domain NotFoundError to 404', async () => {
    const res = await fetch(`${baseUrl}/domain-errors/not-found`);

    assert.equal(res.status, 404);
    const body = await res.json() as any;
    assert.match(body.message, /not found/i);
  });

  it('maps a domain ValidationError to 400 with a field list', async () => {
    const res = await fetch(`${baseUrl}/domain-errors/validation`);

    assert.equal(res.status, 400);
    const body = await res.json() as any;
    assert.deepEqual(body.fields, ['email']);
  });

  it('maps an unexpected error to 500 without leaking the message or a stack trace', async () => {
    const res = await fetch(`${baseUrl}/domain-errors/boom`);

    assert.equal(res.status, 500);
    const text = await res.text();
    assert.doesNotMatch(text, /boom|at .*\.ts:/);
  });
});
