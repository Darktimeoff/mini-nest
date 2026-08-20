import { UseGuards, Controller, Factory, type GuardCanActivateInterface, type ExecutionContextInterface, Get, Param, Injectable, type InterceptorInterface, UseInterceptors } from "../src/index.js";

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
}

const server = Factory.create([UserController])
server.listen(3000)