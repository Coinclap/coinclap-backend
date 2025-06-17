import type { Request, Response, NextFunction } from 'express';
import { HttpStatusCode } from '../enums';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ErrorMiddleware {
  private static logger = Logger.getInstance();

  public static handle = (
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const requestId = res.locals.requestId || uuidv4();

    ErrorMiddleware.logger.error('Unhandled error:', {
      error: error.message,
      stack: error.stack,
      requestId,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    let statusCode = error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (error.name === 'ValidationError') {
      statusCode = HttpStatusCode.BAD_REQUEST;
      message = error.message;
    } else if (error.name === 'CastError') {
      statusCode = HttpStatusCode.BAD_REQUEST;
      message = 'Invalid ID format';
    } else if (error.name === 'MongoError' && (error as any).code === 11000) {
      statusCode = HttpStatusCode.CONFLICT;
      message = 'Duplicate entry';
    } else if (error.isOperational) {
      message = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message,
      timestamp: new Date(),
      requestId,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  };

  public static notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error: AppError = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = HttpStatusCode.NOT_FOUND;
    error.isOperational = true;
    next(error);
  };

  public static asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}
