import 'reflect-metadata';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Inject, Injectable, InjectableScope } from '../src/index.js';
import { LOGGER } from './tokens.js';

interface LoggerInterface {
  log(message: string): void;
}

@Injectable()
class ConsoleLogger implements LoggerInterface {
  log(_message: string): void {}
}

@Injectable()
class ServiceC {
  identify(): string {
    return 'C';
  }
}

@Injectable()
class ServiceB {
  constructor(public readonly c: ServiceC) {}
}

@Injectable()
class ServiceA {
  constructor(public readonly b: ServiceB) {}
}

@Injectable()
class SingletonService {}

@Injectable({ scope: InjectableScope.TRANSIENT })
class TransientService {}

@Injectable()
class NeedsLogger {
  constructor(@Inject(LOGGER) public readonly logger: LoggerInterface) {}
}

const TOKEN_X = Symbol('CyclicX');
const TOKEN_Y = Symbol('CyclicY');

@Injectable()
class CyclicX {
  constructor(@Inject(TOKEN_Y) public readonly y: unknown) {}
}

@Injectable()
class CyclicY {
  constructor(@Inject(TOKEN_X) public readonly x: unknown) {}
}

describe('Container', () => {
  it('resolves a dependency graph recursively (A -> B -> C) with a live instance at the leaf', () => {
    const container = new Container();

    const a = container.resolve(ServiceA);

    assert.ok(a.b instanceof ServiceB);
    assert.ok(a.b.c instanceof ServiceC);
    assert.equal(a.b.c.identify(), 'C');
  });

  it('returns the same instance for singleton scope by default', () => {
    const container = new Container();

    assert.equal(container.resolve(SingletonService), container.resolve(SingletonService));
  });

  it('returns a new instance every time for transient scope', () => {
    const container = new Container();

    assert.notEqual(container.resolve(TransientService), container.resolve(TransientService));
  });

  it('resolves a dependency by @Inject(token) instead of its (erased) type', () => {
    const container = new Container();
    container.bind(LOGGER, ConsoleLogger);

    const instance = container.resolve(NeedsLogger);

    assert.ok(instance.logger instanceof ConsoleLogger);
  });

  it('fails fast with a clear error when nothing is bound to a token', () => {
    const container = new Container();

    assert.throws(() => container.resolve(NeedsLogger), /LOGGER/);
  });

  it('detects a circular dependency and reports the full chain instead of overflowing the stack', () => {
    const container = new Container();
    container.bind(TOKEN_X, CyclicX);
    container.bind(TOKEN_Y, CyclicY);

    assert.throws(() => container.resolve(CyclicX), (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.ok(!(err instanceof RangeError));
      assert.match((err as Error).message, /CyclicX -> CyclicY -> CyclicX/);
      return true;
    });
  });

  it('refuses to resolve a class that is missing @Injectable()', () => {
    class NotInjectable {}

    assert.throws(() => new Container().resolve(NotInjectable), /not marked like injectable/i);
  });
});
