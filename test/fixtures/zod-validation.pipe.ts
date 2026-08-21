import type { ZodType } from "zod";
import type { PipeTransformInterface } from "../../src/interface/pipe-transform.interface.js";
import { BadRequestException } from "../../src/http-exception/bad-request-exception.js";

export class ZodValidationPipe implements PipeTransformInterface {
  constructor(private readonly schema: ZodType) {}

  async transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errorDetails = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw new BadRequestException('Validation failed', errorDetails);
    }

    return result.data;
  }
}
