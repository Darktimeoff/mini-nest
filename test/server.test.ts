import 'reflect-metadata';
import { Factory, Controller, Get, Post, Param, Query, Body, UsePipes, ValidationPipe } from '../src/index.js'
import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserCreateDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}

@Controller('user')
export class UserController {
  constructor() {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    console.log('Get by Id', id)
    return {}
  }

  @Post()
  @UsePipes([new ValidationPipe()])
  async create(@Body() body: UserCreateDto) {
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