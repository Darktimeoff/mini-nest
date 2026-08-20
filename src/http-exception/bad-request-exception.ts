import { HttpException } from './http-exception.js'; 

export class BadRequestException extends HttpException {
  constructor(message: string = 'Bad Request', details: unknown = null) {
    super(400, message, details);
    
    Object.setPrototypeOf(this, new.target.prototype);
  }
}