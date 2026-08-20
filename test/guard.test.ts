import z, { ZodType } from "zod";
import { UseGuards, Controller, Factory, type GuardCanActivateInterface, type ExecutionContextInterface, Get, Param, Injectable, type InterceptorInterface, UseInterceptors, BadRequestException, Post, UsePipes, Body } from "../src/index.js";
import type { PipeTransformInterface } from "../src/interface/pipe-transform.interface.js";

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.email(),                 // Zod 4: z.email(), а НЕ z.string().email()
  age: z.int().min(16),
});

type CreateUserDto = z.infer<typeof CreateUserSchema>;

class ZodValidationPipe implements PipeTransformInterface {
  constructor(private readonly schema: ZodType) {}

  async transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errorDetails = result.error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`)
      
      throw new BadRequestException('Bad Request', errorDetails);
    }
    
    return result.data;   // ← безпечно розпарсене значення; зайві ключі вже зрізані
  }
}

@Injectable()
class LoggingInterceptor implements InterceptorInterface {
  intercept(context: ExecutionContextInterface) {
    const now = performance.now()
  
    return (data: any) => {
      console.log(`After... ${performance.now() - now}ms`)

      return data
    }
  }
}

@Injectable()
class LoggingResponseInterceptor implements InterceptorInterface {
  intercept(context: ExecutionContextInterface) {
    return (data: any) => {
      console.log('Logging response', data)

      return {...data, test: 'intercepted'}
    }
  }
}

@Injectable()
class AuthClassGuard implements GuardCanActivateInterface {
  canActivate(context: ExecutionContextInterface): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    if (req.headers['authorization-class']) {
      return true
    }
    
    return false
  }
}

@Injectable()
class AuthMethodGuard implements GuardCanActivateInterface {
  canActivate(context: ExecutionContextInterface): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    if (req.headers['authorization-method']) {
      return true
    }
    
    return false
  }
}


@UseInterceptors(new LoggingInterceptor)
@UseGuards(new AuthClassGuard)
@Controller('user')
export class UserController {
  @UseInterceptors(new LoggingResponseInterceptor)
  @UseGuards(new AuthMethodGuard)
  @Get(':id')
  async findById(@Param('id') id: string) {
    return {
      id
    }
  }

  @UsePipes([new ZodValidationPipe(CreateUserSchema)])
  @Post()
  async create(@Body() user: CreateUserDto) {
    return user
  }
}

const server = Factory.create([UserController])
server.listen(3000)