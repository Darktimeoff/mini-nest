import { HttpMethodEnum } from "../enum/http-method.enum.js"
import { CreateRouteDecorator } from "./create-route-decorator.js"

export function Get(path: string = '') {
  return CreateRouteDecorator(HttpMethodEnum.GET, path)
}