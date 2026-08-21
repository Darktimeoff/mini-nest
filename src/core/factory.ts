import type { ConstructorType } from "../type/constructor.type.js";
import { Application } from "./application.js";

export class Factory {
  static create(controllers: ConstructorType[]): Application {
    return new Application(controllers)
  }
}
