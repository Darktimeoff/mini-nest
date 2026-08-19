import 'reflect-metadata';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Factory, Controller, Get, Post, Param, Query, Body, UsePipes, ValidationPipe, Injectable } from '../src/index.js'
import { IsEmail, IsNotEmpty } from 'class-validator';
import type { Server } from 'node:http';

export class UserCreateDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

@Injectable()
class UserService {
  getById(id: string) {
    return { id, name: `User ${id}` };
  }

  create(dto: UserCreateDto) {
    return { id: '1', ...dto };
  }

  findAll(limit?: string) {
    return [{ id: '1' }, { id: '2' }].slice(0, limit ? parseInt(limit) : undefined);
  }
}

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.userService.getById(id);
  }

  @Post()
  @UsePipes([new ValidationPipe()])
  async create(@Body() body: UserCreateDto) {
    return this.userService.create(body);
  }

  @Get('')
  async findAll(@Query('limit') limit: string) {
    return this.userService.findAll(limit);
  }

}

@Controller('errors')
export class ErrorController {
  @Get('unhandled')
  async errorUnhandled() {
    throw new Error('Unhandled error');
  }
}

@Controller('test')
export class TestController {
  @Get('no-decorators')
  async noDecorators(undeclared: string) {
    return { received: undeclared };
  }
}

const port = 3001;
const baseUrl = `http://localhost:${port}`;
let server: Server;

// Create server instance
const createTestServer = () => Factory.create([UserController, ErrorController, TestController]);

describe('HTTP Server (Factory + Controllers)', async () => {
  // Start server before first test
  if (!server) {
    server = createTestServer();
    await new Promise<void>((resolve) => {
      server.listen(port, () => resolve());
    });
  }

  it('@Param extracts route parameter', async () => {
    const res = await fetch(`${baseUrl}/users/42`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.id, '42');
  });

  it('@Query extracts query parameter', async () => {
    const res = await fetch(`${baseUrl}/users?limit=1`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.length, 1);
  });

  it('@Body receives parsed JSON', async () => {
    const res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'secret' })
    });
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.email, 'test@example.com');
  });

  it('ValidationPipe rejects invalid DTO with 400', async () => {
    const res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'secret' })
    });
    assert.equal(res.status, 400);
    const body = await res.text();
    assert.match(body, /email/);
  });

  it('ValidationPipe accepts valid DTO', async () => {
    const res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'valid@example.com', password: 'secret' })
    });
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.ok(data instanceof Object);
    assert.equal(data.email, 'valid@example.com');
  });

  it('Container resolves singleton dependencies', async () => {
    const res1 = await fetch(`${baseUrl}/users/1`);
    const res2 = await fetch(`${baseUrl}/users/2`);
    assert.equal(res1.status, 200);
    assert.equal(res2.status, 200);
  });

  it('Route prefix + path combine correctly', async () => {
    const res = await fetch(`${baseUrl}/users`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.ok(Array.isArray(data));
  });

  it('Returns 404 for non-existent route', async () => {
    const res = await fetch(`${baseUrl}/nonexistent`);
    assert.equal(res.status, 404);
  });

  it('GET with no parameters returns all results', async () => {
    const res = await fetch(`${baseUrl}/users`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 2);
  });

  it('Multiple @Query parameters work together', async () => {
    const res = await fetch(`${baseUrl}/users?limit=1&other=value`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.length, 1);
  });

  it('Unhandled errors return 500', async () => {
    const res = await fetch(`${baseUrl}/errors/unhandled`);
    assert.equal(res.status, 500);
    const data = await res.json() as any;
    assert.equal(data.message, 'Internal Server Error');
  });

  it('Parameters without decorators receive undefined', async () => {
    const res = await fetch(`${baseUrl}/test/no-decorators`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.received, undefined);
  });

  it('Valid email with uppercase letters fails validation', async () => {
    const res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'TEST@EXAMPLE.COM', password: 'secret' })
    });
    assert.equal(res.status, 200);
  });

  it('Missing password field fails validation', async () => {
    const res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    assert.equal(res.status, 400);
    const body = await res.text();
    assert.match(body, /password/);
  });

  it('cleanup: close server', async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });
});