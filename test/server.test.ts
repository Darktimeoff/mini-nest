import 'reflect-metadata';
import { createServer } from 'node:http'
import { Container, Controller, Get } from '../src/index.js'

@Controller('user')
export class UserController {
  constructor() {
    
  }
  
  @Get('')
  async findAll() {
    console.log('Call method')
    return []
  }
}




const server = createServer((req, res) => {
  console.log(req.url, req.method)
  res.end()
})

server.listen(3000)