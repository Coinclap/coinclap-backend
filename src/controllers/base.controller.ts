import type { Request, Response } from "express"
import type { IApiResponse, IServiceResponse } from "../types"
import { HttpStatusCode } from "../enums"
import { Logger } from "../utils/logger"
import { v4 as uuidv4 } from "uuid"

export abstract class BaseController {
  protected logger: Logger

  constructor() {
    this.logger = Logger.getInstance()
  }

  protected sendResponse<T>(res: Response, serviceResponse: IServiceResponse<T>, message?: string): void {
    const response: IApiResponse<T> = {
      success: serviceResponse.success,
      message: message || (serviceResponse.success ? "Operation successful" : "Operation failed"),
      data: serviceResponse.data,
      error: serviceResponse.error,
      timestamp: new Date(),
      requestId: res.locals.requestId || uuidv4(),
    }

    res.status(serviceResponse.statusCode).json(response)
  }

  protected sendError(
    res: Response,
    error: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    details?: any,
  ): void {
    const response: IApiResponse = {
      success: false,
      message: "An error occurred",
      error,
      timestamp: new Date(),
      requestId: res.locals.requestId || uuidv4(),
    }

    this.logger.error(`API Error: ${error}`, details)
    res.status(statusCode).json(response)
  }

  protected handleControllerError(error: any, res: Response, operation: string): void {
    this.logger.error(`Error in ${operation}:`, error)

    if (error.name === "ValidationError") {
      this.sendError(res, error.message, HttpStatusCode.BAD_REQUEST)
      return
    }

    if (error.name === "CastError") {
      this.sendError(res, "Invalid ID format", HttpStatusCode.BAD_REQUEST)
      return
    }

    this.sendError(res, "Internal server error", HttpStatusCode.INTERNAL_SERVER_ERROR)
  }

  protected extractPaginationOptions(req: Request) {
    const page = Number.parseInt(req.query.page as string) || 1
    const limit = Math.min(Number.parseInt(req.query.limit as string) || 10, 100)
    const sortBy = (req.query.sortBy as string) || "createdAt"
    const sortOrder = (req.query.sortOrder as string) === "asc" ? "asc" : "desc"

    return { page, limit, sortBy, sortOrder }
  }
}
