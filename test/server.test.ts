import 'reflect-metadata';
import { Factory, Controller, Get, Post } from '../src/index.js'

@Controller('user')
export class UserController {
  constructor() {
    
  }

  @Get(':id')
  async getById() {
    console.log('Get by Id')
    return {}
  }

  @Post()
  async create() {
    console.log('Create')
    return {}
  }
  
  @Get('')
  async findAll() {
    console.log('Find all')
    return []
  }

  private methodName() {
    console.log('Method name private')
    return void 0
  }
}




const server = Factory.create([UserController])

server.listen(3000)