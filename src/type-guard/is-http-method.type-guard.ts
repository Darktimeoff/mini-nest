import { HttpMethodEnum } from "../enum/http-method.enum.js";

export function isHttpMethod(method: unknown): method is HttpMethodEnum {
  return typeof method === 'string' && method in HttpMethodEnum
}