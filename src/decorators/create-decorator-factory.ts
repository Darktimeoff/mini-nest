export function CreateDecoratorFactory(key: string, value: unknown) {
  return (
    target: Object | Function,
    methodName?: string | symbol,
    _?: PropertyDescriptor
  ) => {
    if (methodName) {
      Reflect.defineMetadata(key, value, target, methodName);
    } else {
      Reflect.defineMetadata(key, value, target);
    }
  };
}