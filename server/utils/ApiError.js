// A custom Error that carries an HTTP status code. Controllers throw it; errorHandler turns it into JSON.
export default class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}
