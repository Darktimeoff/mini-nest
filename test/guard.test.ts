import { UseGuards, Controller, Factory, type GuardCanActivateInterface, type ExecutionContextInterface, Get, Param, Injectable } from "../src/index.js";

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


@UseGuards(new AuthClassGuard)
@Controller('user')
export class UserController {
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