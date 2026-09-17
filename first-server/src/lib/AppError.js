class AppError extends Error {
    constructor (message, statusCode) {
        super(message);                 // calls Error constructor with message
        this.statusCode = statusCode;
        this.isOperational = true;      // marks it as an expected error, not a bug

        Error.captureStackTrace(this,  this.constructor);
    }
}

// Helper functions for common errors
const notFound      = (msg = 'Not found')              => new AppError(msg, 404);
const badRequest    = (msg = 'Bad request')             => new AppError(msg, 400);
const unauthorized  = (msg = 'Please log in')           => new AppError(msg, 401);
const forbidden     = (msg = 'Access denied')           => new AppError(msg, 403);
const conflict      = (msg = 'Resource already exists') => new AppError(msg, 409);

module.exports = { AppError, notFound, badRequest, unauthorized, forbidden, conflict };