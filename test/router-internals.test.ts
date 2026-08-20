import 'reflect-metadata';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from '../src/core/router.js';
import { MetadataProperty } from '../src/enum/metadata-property.enum.js';
import { HttpMethodEnum } from '../src/enum/http-method.enum.js';

describe('Router internal defensive branches', () => {
  it('falls back to an empty groups object when URLPattern.exec cannot produce a match', () => {
    class RawController {
      handle() {
        return { ok: true };
      }
    }

    Reflect.defineMetadata(MetadataProperty.CONTROLLER_PATH, 'raw', RawController);
    Reflect.defineMetadata(MetadataProperty.METHOD_PATH, '', RawController.prototype, 'handle');
    Reflect.defineMetadata(MetadataProperty.METHOD_HTTP_OPERATION, HttpMethodEnum.GET, RawController.prototype, 'handle');

    const router = new Router();
    router.build([new RawController()]);

    const originalExec = URLPattern.prototype.exec;
    URLPattern.prototype.exec = function () {
      return null as any;
    };

    try {
      const result = router.match('/raw', 'GET');
      assert.notEqual(result, false);
      assert.deepEqual((result as any).params, {});
    } finally {
      URLPattern.prototype.exec = originalExec;
    }
  });

  it('defaults paramTypes to an empty array when no design:paramtypes metadata exists', () => {
    class RawController {
      handle() {
        return { ok: true };
      }
    }

    Reflect.defineMetadata(MetadataProperty.CONTROLLER_PATH, 'raw-no-types', RawController);
    Reflect.defineMetadata(MetadataProperty.METHOD_PATH, '', RawController.prototype, 'handle');
    Reflect.defineMetadata(MetadataProperty.METHOD_HTTP_OPERATION, HttpMethodEnum.GET, RawController.prototype, 'handle');

    const router = new Router();
    const instance = new RawController();
    router.build([instance]);

    const result = router.match('/raw-no-types', 'GET');
    assert.notEqual(result, false);
    assert.deepEqual((result as any).paramTypes, []);
  });

  it('returns an empty method list for an instance with no prototype', () => {
    const router = new Router() as any;
    const methods = router.getInstanceMethods(Object.create(null));
    assert.deepEqual(methods, []);
  });
});
