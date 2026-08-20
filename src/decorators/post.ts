import { HttpMethodEnum } from "../enum/http-method.enum.js";
import { HTTPHandler } from "./http-handler.js";

export function Post(path: string = '') {
  return HTTPHandler(HttpMethodEnum.POST, path)
}