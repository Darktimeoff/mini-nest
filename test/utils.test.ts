import 'reflect-metadata';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasRequestBody } from '../src/util/has-request-body.util.js';
import { parseJsonBody } from '../src/util/parse-body-json.util.js';
import { createServer, IncomingMessage } from 'node:http';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

describe('Utilities', () => {
  describe('hasRequestBody', () => {
    it('returns false for GET requests', () => {
      const req = { method: 'GET' } as IncomingMessage;
      assert.equal(hasRequestBody(req), false);
    });

    it('returns false for HEAD requests', () => {
      const req = { method: 'HEAD' } as IncomingMessage;
      assert.equal(hasRequestBody(req), false);
    });

    it('returns false for OPTIONS requests', () => {
      const req = { method: 'OPTIONS' } as IncomingMessage;
      assert.equal(hasRequestBody(req), false);
    });

    it('returns true for POST with content-length', () => {
      const req = {
        method: 'POST',
        headers: { 'content-length': '10' }
      } as any;
      assert.equal(hasRequestBody(req), true);
    });

    it('returns true for POST with transfer-encoding', () => {
      const req = {
        method: 'POST',
        headers: { 'transfer-encoding': 'chunked' }
      } as any;
      assert.equal(hasRequestBody(req), true);
    });

    it('returns false for POST with zero content-length', () => {
      const req = {
        method: 'POST',
        headers: { 'content-length': '0' }
      } as any;
      assert.equal(hasRequestBody(req), false);
    });

    it('returns false for POST with invalid content-length', () => {
      const req = {
        method: 'POST',
        headers: { 'content-length': 'invalid' }
      } as any;
      assert.equal(hasRequestBody(req), false);
    });

    it('returns true for POST with positive content-length', () => {
      const req = {
        method: 'POST',
        headers: { 'content-length': '42' }
      } as any;
      assert.equal(hasRequestBody(req), true);
    });

    it('returns false when method is missing', () => {
      const req = { headers: {} } as any;
      assert.equal(hasRequestBody(req), false);
    });

    it('returns false for POST with no headers', () => {
      const req = {
        method: 'POST',
        headers: {}
      } as any;
      assert.equal(hasRequestBody(req), false);
    });
  });

  describe('parseJsonBody', () => {
    it('parses valid JSON body', async () => {
      const server = createServer();
      server.on('request', async (req, res) => {
        const body = await parseJsonBody(req);
        res.end(JSON.stringify(body));
      });

      await new Promise<void>((resolve) => {
        server.listen(3003, async () => {
          const res = await fetch('http://localhost:3003', {
            method: 'POST',
            body: JSON.stringify({ test: 'value' })
          });
          const data = await res.json() as any;
          assert.equal(data.test, 'value');
          server.close(() => resolve());
        });
      });
    });

    it('parses empty JSON body as empty object', async () => {
      const server = createServer();
      server.on('request', async (req, res) => {
        const body = await parseJsonBody(req);
        res.end(JSON.stringify(body));
      });

      await new Promise<void>((resolve) => {
        server.listen(3004, async () => {
          const res = await fetch('http://localhost:3004', {
            method: 'POST',
            headers: { 'content-length': '0' }
          });
          const data = await res.json() as any;
          assert.deepEqual(data, {});
          server.close(() => resolve());
        });
      });
    });

    it('rejects invalid JSON', async () => {
      const server = createServer();
      server.on('request', async (req, res) => {
        try {
          await parseJsonBody(req);
          res.end('should not reach');
        } catch (err) {
          res.writeHead(400);
          res.end('Invalid JSON');
        }
      });

      await new Promise<void>((resolve) => {
        server.listen(3005, async () => {
          const res = await fetch('http://localhost:3005', {
            method: 'POST',
            body: '{ invalid json'
          });
          assert.equal(res.status, 400);
          server.close(() => resolve());
        });
      });
    });

    it('handles request stream errors', async () => {
      const server = createServer();
      server.on('request', async (req, res) => {
        try {
          const promise = parseJsonBody(req);
 
          req.emit('error', new Error('Stream error'));
          await promise;
          res.end('should not reach');
        } catch (err) {
          res.writeHead(500);
          res.end('Error');
        }
      });

      await new Promise<void>((resolve) => {
        server.listen(3006, async () => {
          try {
            await fetch('http://localhost:3006', {
              method: 'POST',
              body: JSON.stringify({ test: 'data' })
            });
          } catch {
          
          }
          server.close(() => resolve());
        });
      });
    });

    it('handles pre-cached request body', async () => {
      const mockReq = {
        body: { cached: true }
      } as any;

      const result = await parseJsonBody(mockReq);
      assert.deepEqual(result, { cached: true });
    });
  });

  describe('ValidationPipe edge cases', async () => {
    const { ValidationPipe } = await import('../src/pipe/validation-pipe.js');

    it('skips validation for String type', async () => {
      const pipe = new ValidationPipe();
      const result = await pipe.transform('test', { metatype: String });
      assert.equal(result, 'test');
    });

    it('skips validation for Number type', async () => {
      const pipe = new ValidationPipe();
      const result = await pipe.transform(123, { metatype: Number });
      assert.equal(result, 123);
    });

    it('skips validation for Boolean type', async () => {
      const pipe = new ValidationPipe();
      const result = await pipe.transform(true, { metatype: Boolean });
      assert.equal(result, true);
    });

    it('skips validation for Array type', async () => {
      const pipe = new ValidationPipe();
      const result = await pipe.transform([1, 2, 3], { metatype: Array });
      assert.deepEqual(result, [1, 2, 3]);
    });

    it('skips validation for Object type', async () => {
      const pipe = new ValidationPipe();
      const result = await pipe.transform({ test: 'data' }, { metatype: Object });
      assert.deepEqual(result, { test: 'data' });
    });

    it('handles undefined metatype', async () => {
      const pipe = new ValidationPipe();
      const result = await pipe.transform({ test: 'value' }, { metatype: undefined as any });
      assert.deepEqual(result, { test: 'value' });
    });

    it('reports a nested validation failure whose error has no own constraints', async () => {
      class Address {
        @IsNotEmpty()
        city!: string;
      }

      class UserWithAddressDto {
        @ValidateNested()
        @Type(() => Address)
        address!: Address;
      }

      const pipe = new ValidationPipe();

      await assert.rejects(
        () => pipe.transform({ address: { city: '' } }, { metatype: UserWithAddressDto }),
      );
    });
  });
});
