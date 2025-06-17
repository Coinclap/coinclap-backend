import type { Request, Response, NextFunction } from 'express';
import type Joi from 'joi';
import { HttpStatusCode } from '../enums';

export class ValidationMiddleware {
  public static validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error } = schema.validate(req.body, { abortEarly: false });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Validation failed',
          error: errorMessages.join(', '),
          timestamp: new Date(),
        });
        return;
      }

      next();
    };
  };

  public static validateParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error } = schema.validate(req.params, { abortEarly: false });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Parameter validation failed',
          error: errorMessages.join(', '),
          timestamp: new Date(),
        });
        return;
      }

      next();
    };
  };

  public static validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error } = schema.validate(req.query, { abortEarly: false });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Query validation failed',
          error: errorMessages.join(', '),
          timestamp: new Date(),
        });
        return;
      }

      next();
    };
  };
}
