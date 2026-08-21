import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContextStore {
  requestId: string
}

const storage = new AsyncLocalStorage<RequestContextStore>();

export class RequestContext {
  static run<T>(store: RequestContextStore, callback: () => T): T {
    return storage.run(store, callback);
  }

  static get requestId(): string | undefined {
    return storage.getStore()?.requestId;
  }
}
