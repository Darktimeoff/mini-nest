import { HttpMethodEnum } from "../enum/http-method.enum.js";
import { CreateRouteDecorator } from "./create-route-decorator.js";

export function Post(path: string = '') {
  return CreateRouteDecorator(HttpMethodEnum.POST, path)
}