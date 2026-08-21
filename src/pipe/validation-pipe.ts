import type { PipeTransformArgumentMetadataInterface } from "../interface/pipe-transform-metadata.interface.js";
import type { PipeTransformInterface } from "../interface/pipe-transform.interface.js";
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BadRequestException } from "../http-exception/bad-request-exception.js";
import type { ConstructorType } from "../type/constructor.type.js";

export class ValidationPipe implements PipeTransformInterface {
  async transform(value: unknown, { metatype }: PipeTransformArgumentMetadataInterface) {
      if (!metatype || !this.toValidate(metatype)) {
        return value;
      }

      const object = plainToInstance(metatype, value);

      const errors = await validate(object);

      if (errors.length > 0) {
        const errorDetails = errors.map((err) => ({
          field: err.property,
          messages: Object.values(err.constraints || {}),
        }));

        throw new BadRequestException('Validation failed', errorDetails);
      }

      return object;
    }

    private toValidate(metatype: ConstructorType): boolean {
      const types: ConstructorType[] = [String, Boolean, Number, Array, Object];
      return !types.includes(metatype);
    }
}
