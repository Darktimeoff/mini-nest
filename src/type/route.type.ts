import type { HttpMethodEnum } from "../enum/http-method.enum.js";

export type RouteType = Partial<Record<HttpMethodEnum, Function>>