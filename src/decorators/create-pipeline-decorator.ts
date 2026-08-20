export function CreatePipelineDecorator(key: string, value: unknown) {
  return (
    target: object,
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