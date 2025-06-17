import type { IServiceResponse } from '../types';
import { HttpStatusCode } from '../enums';
import { Logger } from '../utils/logger';

export abstract class BaseService {
  protected logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  protected createSuccessResponse<T>(
    data: T,
    statusCode: HttpStatusCode = HttpStatusCode.OK
  ): IServiceResponse<T> {
    return {
      success: true,
      data,
      statusCode,
    };
  }

  protected createErrorResponse(
    error: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR
  ): IServiceResponse {
    return {
      success: false,
      error,
      statusCode,
    };
  }

  protected handleServiceError(error: any, operation: string): IServiceResponse {
    this.logger.error(`Error in ${operation}:`, error);

    if (error.name === 'ValidationError') {
      return this.createErrorResponse(error.message, HttpStatusCode.BAD_REQUEST);
    }

    if (error.name === 'CastError') {
      return this.createErrorResponse('Invalid ID format', HttpStatusCode.BAD_REQUEST);
    }

    if (error.code === 11000) {
      return this.createErrorResponse('Duplicate entry', HttpStatusCode.CONFLICT);
    }

    return this.createErrorResponse('Internal server error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
}
