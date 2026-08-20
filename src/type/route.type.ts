import type { HttpMethodEnum } from "../enum/http-method.enum.js";
import type { RouteMethodHandlerInterface } from "../interface/route-method-handler.interface.js";

export type RouteType = Partial<Record<HttpMethodEnum, RouteMethodHandlerInterface>>