import 'reflect-metadata';
import { Factory, Controller, Get, Post, Param, Query, Body } from '../src/index.js'

@Controller('user')
export class UserController {
  constructor() {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    console.log('Get by Id', id)
    return {}
  }

  @Post()
  async create(@Body() body: object) {
    console.log('Create', body)
    return {}
  }
  
  @Get('')
  async findAll(@Query('limit') limit: string) {
    console.log('Find all', limit)
    return []
  }
}




const server = Factory.create([UserController])

server.listen(3000)