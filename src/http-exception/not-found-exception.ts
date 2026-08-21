import { HttpException } from './http-exception.js'; 

export class NotFoundException extends HttpException {
  constructor(message: string = 'Not Found', details: unknown = null) {
    super(404, message, details);
    
    Object.setPrototypeOf(this, new.target.prototype);
  }
}