import 'reflect-metadata';
import { Factory, Controller, Get, Post } from '../src/index.js'

@Controller('user')
export class UserController {
  constructor() {
    
  }

  @Get(':id')
  async getById() {
    return {}
  }

  @Post()
  async create() {
    return {}
  }
  
  @Get('')
  async findAll() {
    console.log('Call method')
    return []
  }

  private methodName() {
    return void 0
  }
}




const server = Factory.create([UserController])

server.listen(3000)