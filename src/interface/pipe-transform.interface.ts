import type { PipeTransformArgumentMetadataInterface } from "./pipe-transform-metadata.interface.js";

export interface PipeTransformInterface {
  transform(value: unknown, metadata: PipeTransformArgumentMetadataInterface): Promise<any>
}