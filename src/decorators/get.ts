import { HttpMethodEnum } from "../enum/http-method.enum.js"
import { HTTPHandler } from "./http-handler.js"

export function Get(path: string = '') {
  return HTTPHandler(HttpMethodEnum.GET, path)
}