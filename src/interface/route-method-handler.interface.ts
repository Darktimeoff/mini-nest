export interface RouteMethodHandlerInterface {
  instance: object,
  method: Function,
  paramTypes: any[],
  params: Record<string, string | undefined>,
  queries: Record<string, string | undefined>
}