export class NotFoundError extends Error {
  constructor(message: string = 'Not Found') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends Error {
  constructor(public readonly fields: string[], message: string = 'Validation failed') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
