import logger from '../logger/index.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const isOperational = err.isOperational === true;
  const statusCode = err.statusCode ?? (isOperational ? 400 : 500);

  if (!isOperational) {
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Internal Server Error',
    code: isOperational ? (err.code ?? undefined) : undefined,
    ...(process.env.NODE_ENV !== 'production' && !isOperational && { stack: err.stack }),
  });
};

export default errorHandler;
