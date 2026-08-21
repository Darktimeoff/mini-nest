import { HttpException } from './http-exception.js'; 

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden resource', details: unknown = null) {
    super(403, message, details);
    
    Object.setPrototypeOf(this, new.target.prototype);
  }
}